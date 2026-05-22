import asyncio

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user
from app.models.spark_job import SparkRunRequest
from app.models.user import UserRole
from app.routes._role_utils import ensure_role
from app.services.spark_service import SparkService

router = APIRouter()


@router.post("/run-job")
async def run_job(payload: SparkRunRequest, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst})
    try:
        created = await SparkService().submit_job(payload.job_name, payload.input_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    asyncio.create_task(SparkService().execute_job(created["id"]))
    return created


@router.get("/jobs")
async def list_jobs(current_user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await SparkService().list_jobs()
