from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.models.alert import AlertAcknowledgeRequest, AlertConfigRequest
from app.models.user import UserRole
from app.routes._role_utils import ensure_role
from app.services.alert_service import AlertService

router = APIRouter()


@router.get("")
async def list_alerts(
    severity: str | None = Query(default=None),
    region: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await AlertService().list_alerts(severity=severity, region=region)


@router.post("/configure")
async def configure_alert(payload: AlertConfigRequest, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst})
    return await AlertService().configure(
        region=payload.region,
        threshold=payload.threshold,
        severity=payload.severity,
        user_id=current_user["id"],
    )


@router.patch("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    payload: AlertAcknowledgeRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    if not payload.acknowledged:
        return {"skipped": True}
    return await AlertService().acknowledge(alert_id, current_user["name"])
