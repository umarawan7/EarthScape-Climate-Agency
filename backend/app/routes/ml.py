from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.models.ml import LiveWeatherRequest, MLForecastBatchRequest, MLForecastRequest, MLPredictRequest
from app.models.user import UserRole
from app.routes._role_utils import ensure_role
from app.services.alert_service import AlertService
from app.services.ml_service import MLService
from app.services.weather_service import WeatherService

router = APIRouter()


@router.get("/models")
async def list_models(current_user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await MLService().list_models()


@router.post("/predict")
async def predict(payload: MLPredictRequest, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    prediction = await MLService().predict_anomaly(
        temperature=payload.temperature,
        latitude=payload.latitude,
        longitude=payload.longitude,
        region=payload.region,
    )
    await AlertService().evaluate_temperature(payload.region, payload.temperature)
    return prediction


@router.post("/forecast")
async def forecast(payload: MLForecastRequest, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await MLService().forecast_temperature(
        year=payload.year,
        month=payload.month,
        day=payload.day,
        latitude=payload.latitude,
        longitude=payload.longitude,
        region=payload.region,
    )


@router.post("/forecast-batch")
async def forecast_batch(payload: MLForecastBatchRequest, current_user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    items = [item.model_dump() for item in payload.items]
    return await MLService().batch_forecast(items)


@router.post("/live-weather")
async def live_weather(payload: LiveWeatherRequest, current_user: dict = Depends(get_current_user)) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})

    weather = await WeatherService().fetch_current_weather(payload.latitude, payload.longitude)
    prediction = await MLService().predict_anomaly(
        temperature=weather["temperature"],
        latitude=payload.latitude,
        longitude=payload.longitude,
        region=payload.region,
    )
    await AlertService().evaluate_temperature(payload.region, weather["temperature"])

    return {
        "source": weather["source"],
        "region": payload.region,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "temperature": weather["temperature"],
        "observed_at": weather["observed_at"],
        "is_anomaly": prediction.get("is_anomaly", False),
        "anomaly_score": prediction.get("confidence_score", 0.0),
    }


@router.get("/city-to-coordinates")
async def city_to_coordinates(
    city: str = Query(..., min_length=2, max_length=120),
    current_user: dict = Depends(get_current_user),
) -> dict:
    ensure_role(current_user, {UserRole.admin, UserRole.analyst, UserRole.viewer})
    return await WeatherService().geocode_city(city)

