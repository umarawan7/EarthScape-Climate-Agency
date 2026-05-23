from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from fastapi import HTTPException

from app.core.config import settings
from app.core.database import db
from app.core.serialization import mongo_to_public


class MLService:
    def __init__(self) -> None:
        self.predictions = db.get_collection("predictions")
        self.climate_records = db.get_collection("climate_records")
        self.anomalies = db.get_collection("anomalies")
        self._isolation_model = None
        self._lr_coefficients: np.ndarray | None = None
        self._lr_intercept: float | None = None
        self._lr_feature_count: int | None = None

    @property
    def isolation_model_path(self) -> Path:
        return settings.model_dir / "isolation_forest.pkl"

    @property
    def trend_model_path(self) -> Path:
        return settings.model_dir / "spark_linear_regression"

    def _load_isolation_model(self):
        if self._isolation_model is None:
            if not self.isolation_model_path.exists():
                raise HTTPException(status_code=404, detail="Isolation Forest model not found. Run retrain_models first.")
            self._isolation_model = joblib.load(self.isolation_model_path)
        return self._isolation_model

    async def list_models(self) -> list[dict]:
        models: list[dict] = []
        for path in settings.model_dir.glob("*"):
            if path.is_file() and path.suffix in {".pkl", ".joblib"}:
                models.append(
                    {
                        "name": path.name,
                        "type": "sklearn",
                        "updated_at": datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc),
                    }
                )
            if path.is_dir() and path.name == "spark_linear_regression":
                models.append(
                    {
                        "name": path.name,
                        "type": "spark_mllib",
                        "updated_at": datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc),
                    }
                )
        return sorted(models, key=lambda x: x["updated_at"], reverse=True)

    async def predict_anomaly(
        self,
        temperature: float,
        latitude: float,
        longitude: float,
        region: str
    ) -> dict:
        model = self._load_isolation_model()
        features = np.array([[temperature, latitude, longitude]], dtype=float)

        pred = model.predict(features)[0]
        score = float(model.decision_function(features)[0])

        # FIX: convert numpy.bool_ -> bool
        is_anomaly = bool(pred == -1)

        now = datetime.now(timezone.utc)

        record = {
            "model_name": "IsolationForest",
            "region": region,
            "target_date": now,
            "predicted_temp": float(temperature),
            "confidence_score": float(score),
            "is_anomaly": is_anomaly,
            "created_at": now,
        }

        result = await self.predictions.insert_one(record)

        climate_record_id = await self._store_climate_record(
            source="inference",
            region=region,
            latitude=latitude,
            longitude=longitude,
            timestamp=now,
            temperature=temperature,
            data_type="inference",
        )

        if is_anomaly:
            await self._store_anomaly(
                record_id=climate_record_id,
                anomaly_type="isolation_forest",
                severity=self._severity_from_score(score),
                description=f"Isolation Forest flagged anomaly (score={score:.4f})",
                region=region,
                latitude=latitude,
                longitude=longitude,
                value=temperature,
            )

        created = await self.predictions.find_one(
            {"_id": result.inserted_id}
        )

        return mongo_to_public(created)

    def _load_lr_model(self) -> tuple[np.ndarray, float, int]:
        """Load linear regression coefficients from Spark model without starting a JVM."""
        if self._lr_coefficients is not None:
            return self._lr_coefficients, self._lr_intercept, self._lr_feature_count

        if not self.trend_model_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Spark linear regression model not found. Run retrain_models first.",
            )

        import json

        metadata_dir = self.trend_model_path / "metadata"
        metadata_path = None
        if metadata_dir.exists():
            parts = list(metadata_dir.glob("part-00000*"))
            if parts:
                metadata_path = parts[0]
        data_dir = self.trend_model_path / "data"

        if not metadata_path or not metadata_path.exists():
            raise HTTPException(status_code=500, detail="Model metadata missing.")

        with open(metadata_path, "r") as f:
            meta = json.load(f)

        params = meta.get("paramMap", {})
        coefficients = params.get("coefficients", None)
        intercept = params.get("intercept", 0.0)

        if coefficients is None:
            # Try to read from parquet data directory using pandas
            try:
                import pandas as pd
                parts = list(data_dir.glob("part-*.parquet"))
                if not parts:
                    raise FileNotFoundError("No parquet parts found")
                row = pd.read_parquet(parts[0]).iloc[0]
                coef_val = row.get("coefficients", row.get("weights", []))
                if isinstance(coef_val, dict):
                    coefficients = coef_val.get("values", [])
                elif hasattr(coef_val, "get") and coef_val.get("values") is not None:
                    coefficients = coef_val.get("values")
                elif hasattr(coef_val, "__getitem__"):
                    try:
                        coefficients = coef_val["values"]
                    except Exception:
                        coefficients = coef_val
                else:
                    coefficients = coef_val
                coefficients = list(coefficients)
                intercept = float(row.get("intercept", 0.0))
            except Exception as exc:
                raise HTTPException(
                    status_code=500, detail=f"Cannot read model coefficients: {exc}"
                ) from exc

        coefficients = np.array(coefficients, dtype=float)
        intercept = float(intercept)
        feature_count = len(coefficients)

        self._lr_coefficients = coefficients
        self._lr_intercept = intercept
        self._lr_feature_count = feature_count
        return coefficients, intercept, feature_count

    def _build_feature_vector(self, year: int, month: int, day: int, latitude: float, longitude: float, feature_count: int) -> np.ndarray:
        time_idx = float(year) + (float(month) - 1.0 + (float(day) - 1.0) / 30.0) / 12.0
        sin_m = float(np.sin(2.0 * np.pi * (float(month) + (float(day) - 1.0) / 30.0) / 12.0))
        cos_m = float(np.cos(2.0 * np.pi * (float(month) + (float(day) - 1.0) / 30.0) / 12.0))
        if feature_count >= 5:
            return np.array([time_idx, float(latitude), float(longitude), sin_m, cos_m])
        return np.array([time_idx, float(latitude), float(longitude)])

    async def forecast_temperature(self, year: int, month: int, day: int, latitude: float, longitude: float, region: str) -> dict:
        coefficients, intercept, feature_count = self._load_lr_model()
        features = self._build_feature_vector(year, month, day, latitude, longitude, feature_count)
        prediction = float(np.dot(coefficients, features) + intercept)

        now = datetime.now(timezone.utc)
        doc = {
            "model_name": "SparkLinearRegression",
            "region": region,
            "target_date": datetime(year=year, month=month, day=day, tzinfo=timezone.utc),
            "predicted_temp": prediction,
            "confidence_score": None,
            "is_anomaly": None,
            "created_at": now,
        }
        result = await self.predictions.insert_one(doc)
        created = await self.predictions.find_one({"_id": result.inserted_id})
        return {
            "model_name": "SparkLinearRegression",
            "region": region,
            "year": year,
            "month": month,
            "day": day,
            "predicted_temperature_c": prediction,
            "created_at": created["created_at"],
            "prediction_id": str(created["_id"]),
        }

    async def batch_forecast(self, items: list[dict]) -> list[dict]:
        """Run many forecasts with a single model load — no parallel Spark sessions."""
        coefficients, intercept, feature_count = self._load_lr_model()
        results = []
        now = datetime.now(timezone.utc)
        docs = []
        for item in items:
            year = item["year"]
            month = item["month"]
            day = item.get("day", 1)
            latitude = item["latitude"]
            longitude = item["longitude"]
            region = item["region"]
            features = self._build_feature_vector(year, month, day, latitude, longitude, feature_count)
            prediction = float(np.dot(coefficients, features) + intercept)
            docs.append({
                "model_name": "SparkLinearRegression",
                "region": region,
                "target_date": datetime(year=year, month=month, day=1, tzinfo=timezone.utc),
                "predicted_temp": prediction,
                "confidence_score": None,
                "is_anomaly": None,
                "created_at": now,
            })
            results.append({
                "model_name": "SparkLinearRegression",
                "region": region,
                "year": year,
                "month": month,
                "predicted_temperature_c": prediction,
            })
        if docs:
            await self.predictions.insert_many(docs)
        return results

    async def _store_climate_record(
        self,
        source: str,
        region: str,
        latitude: float,
        longitude: float,
        timestamp: datetime,
        temperature: float,
        data_type: str,
    ) -> str:
        climate_doc = {
            "source": source,
            "region": region,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "timestamp": timestamp,
            "temperature": float(temperature),
            "data_type": data_type,
        }
        result = await self.climate_records.insert_one(climate_doc)
        return str(result.inserted_id)


    async def _store_anomaly(
        self,
        record_id: str,
        anomaly_type: str,
        severity: str,
        description: str,
        region: str,
        latitude: float,
        longitude: float,
        value: float,
    ) -> None:
        await self.anomalies.insert_one(
            {
                "record_id": record_id,
                "anomaly_type": anomaly_type,
                "severity": severity,
                "region": region,
                "latitude": float(latitude),
                "longitude": float(longitude),
                "value": float(value),
                "detected_at": datetime.now(timezone.utc),
                "description": description,
            }
        )

    def _severity_from_score(self, score: float) -> str:
        if score < -0.2:
            return "critical"
        if score < -0.1:
            return "high"
        if score < 0:
            return "medium"
        return "low"
