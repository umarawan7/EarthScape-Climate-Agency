from datetime import datetime

from pydantic import BaseModel, Field


class MLPredictRequest(BaseModel):
    temperature: float
    latitude: float
    longitude: float
    region: str = Field(min_length=2, max_length=150)


class MLPredictResponse(BaseModel):
    model_name: str
    region: str
    temperature: float
    is_anomaly: bool
    anomaly_score: float
    created_at: datetime


class LiveWeatherRequest(BaseModel):
    latitude: float
    longitude: float
    region: str = Field(default="selected-region", min_length=2, max_length=150)


class LiveWeatherResponse(BaseModel):
    source: str
    region: str
    latitude: float
    longitude: float
    temperature: float
    observed_at: datetime
    is_anomaly: bool
    anomaly_score: float
