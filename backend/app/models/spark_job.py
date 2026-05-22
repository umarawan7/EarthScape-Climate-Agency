from datetime import datetime

from pydantic import BaseModel, Field


class SparkRunRequest(BaseModel):
    job_name: str = Field(min_length=2, max_length=120)
    input_path: str | None = None


class SparkJobPublic(BaseModel):
    id: str
    job_name: str
    status: str
    input_path: str | None = None
    output_path: str | None = None
    started_at: datetime
    finished_at: datetime | None = None
    logs: str | None = None
