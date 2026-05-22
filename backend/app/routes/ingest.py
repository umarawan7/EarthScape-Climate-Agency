from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.dependencies import get_current_user
from app.models.ingestion import IngestionScheduleRequest
from app.models.user import UserRole
from app.routes._role_utils import ensure_role
from app.services.ingestion_service import IngestionService

router = APIRouter()


@router.post("/upload")
async def upload_file(
    source_name: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst})
    return await IngestionService().save_upload(source_name, file)


@router.post("/schedule")
async def schedule_ingestion(payload: IngestionScheduleRequest, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst})
    return await IngestionService().schedule_ingestion(
        source_name=payload.source_name,
        interval_minutes=payload.interval_minutes,
        created_by=current_user["id"],
    )


@router.get("/history")
async def ingestion_history(current_user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await IngestionService().list_history()
