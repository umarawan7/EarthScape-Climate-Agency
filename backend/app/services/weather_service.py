from datetime import datetime, timezone

import httpx
from fastapi import HTTPException

from app.core.config import settings


class WeatherService:
    async def fetch_current_weather(self, latitude: float, longitude: float) -> dict:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m",
            "timezone": "auto",
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(settings.open_meteo_base_url, params=params)
            response.raise_for_status()
            payload = response.json()

        current = payload.get("current", {})
        temp = current.get("temperature_2m")
        time_str = current.get("time")
        if temp is None or time_str is None:
            raise HTTPException(status_code=502, detail="Open-Meteo response missing current weather")

        observed_at = datetime.fromisoformat(time_str)
        if observed_at.tzinfo is None:
            observed_at = observed_at.replace(tzinfo=timezone.utc)

        return {
            "temperature": float(temp),
            "observed_at": observed_at,
            "latitude": latitude,
            "longitude": longitude,
            "source": "open-meteo",
        }

    async def geocode_city(self, city: str) -> dict:
        params = {"name": city, "count": 1, "language": "en", "format": "json"}
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(settings.open_meteo_geocode_url, params=params)
            response.raise_for_status()
            payload = response.json()

        results = payload.get("results") or []
        if not results:
            raise HTTPException(status_code=404, detail="City not found")
        first = results[0]
        return {
            "name": first.get("name"),
            "country": first.get("country"),
            "latitude": float(first.get("latitude")),
            "longitude": float(first.get("longitude")),
        }
