from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.models.user import UserRole, UserUpdateRole
from app.routes._role_utils import ensure_role
from app.services.auth_service import AuthService

router = APIRouter()


@router.get("")
async def list_users(current_user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_role(current_user, {UserRole.admin})
    return await AuthService().list_users()


@router.patch("/{user_id}/role")
async def update_role(user_id: str, payload: UserUpdateRole, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin})
    return await AuthService().update_role(user_id, payload.role)


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin})
    await AuthService().delete_user(user_id)
    return {"deleted": True}
