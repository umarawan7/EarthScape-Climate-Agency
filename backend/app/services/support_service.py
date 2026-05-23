from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException
from pymongo import ReturnDocument

from app.core.database import db
from app.core.serialization import mongo_to_public
from app.models.support import TicketStatus


class SupportService:
    def __init__(self) -> None:
        self.collection = db.get_collection("support_tickets")

    async def create_ticket(self, user_id: str, subject: str, description: str, category: str) -> dict:
        now = datetime.now(timezone.utc)
        doc = {
            "user_id": user_id,
            "subject": subject,
            "description": description,
            "category": category,
            "status": TicketStatus.open.value,
            "created_at": now,
            "updated_at": now,
            "admin_response": None,
        }
        result = await self.collection.insert_one(doc)
        created = await self.collection.find_one({"_id": result.inserted_id})
        return mongo_to_public(created)

    async def list_tickets(self, user_id: str, can_view_all: bool) -> list[dict]:
        query = {} if can_view_all else {"user_id": user_id}
        cursor = self.collection.find(query, sort=[("updated_at", -1)]).limit(300)
        items: list[dict] = []
        async for item in cursor:
            items.append(mongo_to_public(item))
        return items

    async def update_ticket(
        self,
        ticket_id: str,
        status: str | None,
        admin_response: str | None,
        responder_id: str,
        responder_name: str,
        responder_role: str,
    ) -> dict:
        try:
            ticket_object_id = ObjectId(ticket_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid ticket id") from exc

        set_data = {"updated_at": datetime.now(timezone.utc)}
        if status is not None:
            set_data["status"] = status
        if admin_response is not None:
            set_data["admin_response"] = admin_response
            set_data["admin_response_by"] = responder_name
            set_data["admin_response_by_id"] = responder_id
            set_data["admin_response_by_role"] = responder_role

        updated = await self.collection.find_one_and_update(
            {"_id": ticket_object_id},
            {"$set": set_data},
            return_document=ReturnDocument.AFTER,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return mongo_to_public(updated)
