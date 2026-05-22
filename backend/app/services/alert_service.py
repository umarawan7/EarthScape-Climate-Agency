import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage

from bson import ObjectId
from fastapi import HTTPException
from pymongo import ReturnDocument

from app.core.config import settings
from app.core.database import db
from app.core.serialization import mongo_to_public
from app.core.websocket_manager import ws_manager
from app.models.alert import AlertCreateInternal, AlertSeverity


class AlertService:
    def __init__(self) -> None:
        self.alerts = db.get_collection("alerts")
        self.configs = db.get_collection("alert_configs")
        self.users = db.get_collection("users")

    async def configure(self, region: str, threshold: float, severity: AlertSeverity, user_id: str) -> dict:
        now = datetime.now(timezone.utc)
        updated = await self.configs.find_one_and_update(
            {"region": region.lower()},
            {
                "$set": {
                    "region": region.lower(),
                    "threshold": threshold,
                    "severity": severity.value,
                    "updated_by": user_id,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return mongo_to_public(updated)

    async def list_alerts(self, severity: str | None = None, region: str | None = None) -> list[dict]:
        query: dict = {}
        if severity:
            query["severity"] = severity
        if region:
            query["region"] = region.lower()

        cursor = self.alerts.find(query, sort=[("triggered_at", -1)]).limit(300)
        items: list[dict] = []
        async for alert in cursor:
            items.append(mongo_to_public(alert))
        return items

    async def acknowledge(self, alert_id: str, user_name: str) -> dict:
        try:
            alert_object_id = ObjectId(alert_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid alert id") from exc

        updated = await self.alerts.find_one_and_update(
            {"_id": alert_object_id},
            {"$set": {"acknowledged": True, "acknowledged_by": user_name}},
            return_document=ReturnDocument.AFTER,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Alert not found")
        return mongo_to_public(updated)

    async def evaluate_temperature(self, region: str, value: float) -> dict | None:
        config = await self.configs.find_one({"region": region.lower()})
        if not config:
            return None

        if value <= config["threshold"]:
            return None

        payload = AlertCreateInternal(
            region=region.lower(),
            threshold=float(config["threshold"]),
            actual_value=float(value),
            severity=AlertSeverity(config["severity"]),
            message=f"Temperature threshold exceeded in {region}: {value:.2f} > {config['threshold']:.2f}",
        )

        doc = {
            "type": payload.type,
            "severity": payload.severity.value,
            "region": payload.region,
            "message": payload.message,
            "threshold": payload.threshold,
            "actual_value": payload.actual_value,
            "triggered_at": payload.triggered_at,
            "acknowledged": False,
            "acknowledged_by": None,
        }
        result = await self.alerts.insert_one(doc)
        created = await self.alerts.find_one({"_id": result.inserted_id})
        public_alert = mongo_to_public(created)

        await ws_manager.broadcast("alerts", public_alert)
        await self._send_email_to_admins(public_alert)
        return public_alert

    async def _send_email_to_admins(self, alert: dict) -> None:
        if not settings.smtp_user or not settings.smtp_password:
            return

        emails: list[str] = []
        async for user in self.users.find({"role": "admin"}, {"email": 1}):
            email = user.get("email")
            if email:
                emails.append(email)

        if not emails:
            return

        message = EmailMessage()
        message["Subject"] = f"[EarthScape Alert] {alert['severity'].upper()} in {alert['region']}"
        message["From"] = settings.smtp_from
        message["To"] = ", ".join(emails)
        message.set_content(
            f"Alert: {alert['message']}\n"
            f"Threshold: {alert['threshold']}\n"
            f"Actual Value: {alert['actual_value']}\n"
            f"Triggered At: {alert['triggered_at']}"
        )

        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(message)
        except Exception:
            return
