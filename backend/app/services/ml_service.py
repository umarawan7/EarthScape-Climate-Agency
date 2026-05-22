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
        self._model = None

    @property
    def model_path(self) -> Path:
        return settings.model_dir / "isolation_forest.pkl"

    def _load_model(self):
        if self._model is None:
            if not self.model_path.exists():
                raise HTTPException(status_code=404, detail="Isolation Forest model not found. Run retrain_models first.")
            self._model = joblib.load(self.model_path)
        return self._model

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
        return sorted(models, key=lambda x: x["updated_at"], reverse=True)

    async def predict_anomaly(self, temperature: float, latitude: float, longitude: float, region: str) -> dict:
        model = self._load_model()
        features = np.array([[temperature, latitude, longitude]], dtype=float)

        pred = model.predict(features)[0]
        score = float(model.decision_function(features)[0])
        is_anomaly = pred == -1

        record = {
            "model_name": "IsolationForest",
            "region": region,
            "target_date": datetime.now(timezone.utc),
            "predicted_temp": temperature,
            "confidence_score": score,
            "is_anomaly": is_anomaly,
            "created_at": datetime.now(timezone.utc),
        }
        result = await self.predictions.insert_one(record)
        created = await self.predictions.find_one({"_id": result.inserted_id})
        return mongo_to_public(created)
