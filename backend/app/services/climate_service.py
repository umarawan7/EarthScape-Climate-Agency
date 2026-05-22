from app.core.database import db
from app.core.serialization import mongo_to_public


class ClimateService:
    def __init__(self) -> None:
        self.records = db.get_collection("climate_records")
        self.anomalies = db.get_collection("anomalies")
        self.predictions = db.get_collection("predictions")

    async def list_records(self, limit: int = 200) -> list[dict]:
        cursor = self.records.find({}, sort=[("timestamp", -1)]).limit(limit)
        output: list[dict] = []
        async for item in cursor:
            output.append(mongo_to_public(item))
        return output

    async def list_anomalies(self, limit: int = 200) -> list[dict]:
        cursor = self.anomalies.find({}, sort=[("detected_at", -1)]).limit(limit)
        output: list[dict] = []
        async for item in cursor:
            output.append(mongo_to_public(item))
        return output

    async def list_predictions(self, limit: int = 200) -> list[dict]:
        cursor = self.predictions.find({}, sort=[("created_at", -1)]).limit(limit)
        output: list[dict] = []
        async for item in cursor:
            output.append(mongo_to_public(item))
        return output
