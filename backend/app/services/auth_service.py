from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo import ReturnDocument

from app.core.database import db
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.serialization import mongo_to_public
from app.models.user import TokenPair, UserCreate, UserRole


class AuthService:
    def __init__(self) -> None:
        self.collection = db.get_collection("users")

    async def _is_first_user(self) -> bool:
        return await self.collection.count_documents({}) == 0

    async def register_user(self, payload: UserCreate, actor: dict | None = None) -> dict:
        if await self.collection.find_one({"email": payload.email.lower()}):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        is_first_user = await self._is_first_user()
        if is_first_user:
            role = UserRole.admin.value
        else:
            if actor is None or actor.get("role") != UserRole.admin.value:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can register users")
            role = payload.role.value

        now = datetime.now(timezone.utc)
        doc = {
            "name": payload.name,
            "email": payload.email.lower(),
            "password_hash": hash_password(payload.password),
            "role": role,
            "created_at": now,
            "last_login": None,
        }
        result = await self.collection.insert_one(doc)
        created = await self.collection.find_one({"_id": result.inserted_id})
        if not created:
            raise HTTPException(status_code=500, detail="Could not create user")
        return self._sanitize_user(created)

    async def login(self, email: str, password: str) -> TokenPair:
        user = await self.collection.find_one({"email": email.lower()})
        if not user or not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        await self.collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}},
        )

        subject = str(user["_id"])
        return TokenPair(
            access_token=create_access_token(subject),
            refresh_token=create_refresh_token(subject),
        )

    async def refresh(self, refresh_token: str) -> TokenPair:
        try:
            payload = decode_token(refresh_token)
        except TokenError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token")

        try:
            user_object_id = ObjectId(user_id)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token subject") from exc

        user = await self.collection.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist")

        return TokenPair(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
        )

    async def get_by_id(self, user_id: str) -> dict:
        try:
            user_object_id = ObjectId(user_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid user id") from exc

        user = await self.collection.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return self._sanitize_user(user)

    async def list_users(self) -> list[dict]:
        cursor = self.collection.find({}, sort=[("created_at", -1)])
        users: list[dict] = []
        async for user in cursor:
            users.append(self._sanitize_user(user))
        return users

    async def update_role(self, user_id: str, role: UserRole) -> dict:
        try:
            user_object_id = ObjectId(user_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid user id") from exc

        result = await self.collection.find_one_and_update(
            {"_id": user_object_id},
            {"$set": {"role": role.value}},
            return_document=ReturnDocument.AFTER,
        )
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        return self._sanitize_user(result)

    async def delete_user(self, user_id: str) -> None:
        try:
            user_object_id = ObjectId(user_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid user id") from exc

        deletion = await self.collection.delete_one({"_id": user_object_id})
        if deletion.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

    def _sanitize_user(self, user_doc: dict) -> dict:
        parsed = mongo_to_public(user_doc)
        parsed.pop("password_hash", None)
        return parsed

    async def self_register(self, payload: UserCreate) -> dict:
        """Allow public self-signup — role is always forced to viewer."""
        if await self.collection.find_one({"email": payload.email.lower()}):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        now = datetime.now(timezone.utc)
        doc = {
            "name": payload.name,
            "email": payload.email.lower(),
            "password_hash": hash_password(payload.password),
            "role": UserRole.viewer.value,
            "created_at": now,
            "last_login": None,
        }
        result = await self.collection.insert_one(doc)
        created = await self.collection.find_one({"_id": result.inserted_id})
        if not created:
            raise HTTPException(status_code=500, detail="Could not create user")
        return self._sanitize_user(created)

    async def reset_password(self, email: str, new_password: str) -> dict:
        """Reset password by email — suitable for local deployment without email OTP."""
        user = await self.collection.find_one({"email": email.lower()})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account with that email")

        await self.collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"password_hash": hash_password(new_password)}},
        )
        return {"detail": "Password updated successfully"}

    async def update_profile(self, user_id: str, email: str | None, current_password: str | None, new_password: str | None) -> dict:
        try:
            user_object_id = ObjectId(user_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid user id") from exc

        user = await self.collection.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        updates = {}
        if email:
            email_lower = email.lower()
            if email_lower != user["email"]:
                if await self.collection.find_one({"email": email_lower}):
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
                updates["email"] = email_lower

        if new_password:
            if not current_password:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password required to set new password")
            if not verify_password(current_password, user["password_hash"]):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid current password")
            updates["password_hash"] = hash_password(new_password)

        if not updates:
            return self._sanitize_user(user)

        result = await self.collection.find_one_and_update(
            {"_id": user_object_id},
            {"$set": updates},
            return_document=ReturnDocument.AFTER,
        )
        return self._sanitize_user(result)


