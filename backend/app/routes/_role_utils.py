from fastapi import HTTPException

from app.models.user import UserRole


def ensure_role(user: dict, allowed: set[UserRole]) -> None:
    role = user.get("role")
    if role not in {item.value for item in allowed}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
