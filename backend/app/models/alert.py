from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class AlertSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AlertConfigRequest(BaseModel):
    region: str = Field(min_length=2, max_length=150)
    threshold: float
    severity: AlertSeverity = AlertSeverity.medium


class AlertAcknowledgeRequest(BaseModel):
    acknowledged: bool = True


class AlertPublic(BaseModel):
    id: str
    type: str
    severity: AlertSeverity
    region: str
    message: str
    threshold: float
    actual_value: float
    triggered_at: datetime
    acknowledged: bool
    acknowledged_by: str | None = None


class AlertCreateInternal(BaseModel):
    type: str = "temperature_threshold"
    region: str
    threshold: float
    actual_value: float
    severity: AlertSeverity
    message: str
    triggered_at: datetime = Field(default_factory=datetime.utcnow)
