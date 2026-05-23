from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.models.support import SupportTicketCreate, SupportTicketUpdate
from app.models.user import UserRole
from app.routes._role_utils import ensure_role
from app.services.support_service import SupportService

router = APIRouter()


@router.post("/ticket")
async def create_ticket(payload: SupportTicketCreate, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await SupportService().create_ticket(
        user_id=current_user["id"],
        subject=payload.subject,
        description=payload.description,
        category=payload.category.value,
    )


@router.get("/tickets")
async def list_tickets(current_user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await SupportService().list_tickets(
        user_id=current_user["id"],
        can_view_all=current_user["role"] in {UserRole.admin.value, UserRole.analyst.value},
    )


@router.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, payload: SupportTicketUpdate, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst})
    return await SupportService().update_ticket(
        ticket_id=ticket_id,
        status=payload.status.value if payload.status else None,
        admin_response=payload.admin_response,
        responder_id=current_user["id"],
        responder_name=current_user["name"],
        responder_role=current_user["role"],
    )
