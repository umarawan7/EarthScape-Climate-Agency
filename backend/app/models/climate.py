from datetime import datetime

from pydantic import BaseModel, Field


class ClimateRecordPublic(BaseModel):
    id: str
    source: str
    region: str
    latitude: float
    longitude: float
    timestamp: datetime
    temperature: float
    data_type: str


class AnomalyPublic(BaseModel):
    id: str
    record_id: str
    anomaly_type: str
    severity: str
    detected_at: datetime
    description: str


class PredictionPublic(BaseModel):
    id: str
    model_name: str
    region: str
    target_date: datetime
    predicted_temp: float
    confidence_score: float
    created_at: datetime
