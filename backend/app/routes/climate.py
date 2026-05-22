from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.models.user import UserRole
from app.routes._role_utils import ensure_role
from app.services.climate_service import ClimateService

router = APIRouter()


@router.get("/records")
async def records(current_user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await ClimateService().list_records()


@router.get("/anomalies")
async def anomalies(current_user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await ClimateService().list_anomalies()


@router.get("/predictions")
async def predictions(current_user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await ClimateService().list_predictions()
