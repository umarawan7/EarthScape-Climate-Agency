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


class MLForecastRequest(BaseModel):
    year: int = Field(ge=1800, le=2200)
    month: int = Field(ge=1, le=12)
    day: int = Field(default=1, ge=1, le=31)
    latitude: float
    longitude: float
    region: str = Field(min_length=2, max_length=150)


class MLForecastBatchItem(BaseModel):
    year: int = Field(ge=1800, le=2200)
    month: int = Field(ge=1, le=12)
    day: int = Field(default=1, ge=1, le=31)
    latitude: float
    longitude: float
    region: str = Field(min_length=2, max_length=150)



class MLForecastBatchRequest(BaseModel):
    items: list[MLForecastBatchItem] = Field(min_length=1, max_length=60)


class MLForecastResponse(BaseModel):
    model_name: str
    region: str
    year: int
    month: int
    predicted_temperature_c: float
    created_at: datetime
