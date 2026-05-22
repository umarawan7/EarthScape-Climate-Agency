from datetime import datetime

from pydantic import BaseModel, Field


class IngestionScheduleRequest(BaseModel):
    source_name: str = Field(min_length=2, max_length=150)
    interval_minutes: int = Field(ge=5, le=10080)


class IngestionLogPublic(BaseModel):
    id: str
    source_name: str
    file_path: str
    format: str
    record_count: int
    ingested_at: datetime
    status: str
    error_message: str | None = None
