import csv
import json
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.core.database import db
from app.core.serialization import mongo_to_public


class IngestionService:
    def __init__(self) -> None:
        self.logs = db.get_collection("ingestion_logs")
        self.schedules = db.get_collection("ingestion_schedules")

    async def save_upload(self, source_name: str, upload: UploadFile) -> dict:
        suffix = Path(upload.filename or "upload.bin").suffix.lower()
        if suffix not in {".csv", ".json"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV and JSON are supported")

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safe_name = Path(upload.filename or f"{source_name}{suffix}").name
        file_path = settings.raw_data_dir / f"{timestamp}_{safe_name}"

        try:
            with file_path.open("wb") as destination:
                upload.file.seek(0)
                shutil.copyfileobj(upload.file, destination)
            record_count = self._count_records(file_path, suffix)

            log = {
                "source_name": source_name,
                "file_path": str(file_path),
                "format": suffix.removeprefix("."),
                "record_count": record_count,
                "ingested_at": datetime.now(timezone.utc),
                "status": "success",
                "error_message": None,
                "trigger": "manual",
            }
            result = await self.logs.insert_one(log)
            created = await self.logs.find_one({"_id": result.inserted_id})
            return mongo_to_public(created)
        except Exception as exc:
            error_log = {
                "source_name": source_name,
                "file_path": str(file_path),
                "format": suffix.removeprefix("."),
                "record_count": 0,
                "ingested_at": datetime.now(timezone.utc),
                "status": "failed",
                "error_message": str(exc),
                "trigger": "manual",
            }
            await self.logs.insert_one(error_log)
            raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc

    async def schedule_ingestion(self, source_name: str, interval_minutes: int, created_by: str) -> dict:
        now = datetime.now(timezone.utc)
        schedule = {
            "source_name": source_name,
            "interval_minutes": interval_minutes,
            "next_run": now,
            "status": "active",
            "created_by": created_by,
            "created_at": now,
            "updated_at": now,
            "last_run": None,
        }
        result = await self.schedules.insert_one(schedule)
        created = await self.schedules.find_one({"_id": result.inserted_id})
        return mongo_to_public(created)

    async def list_schedules(self, limit: int = 100) -> list[dict]:
        cursor = self.schedules.find({}, sort=[("updated_at", -1)]).limit(limit)
        output: list[dict] = []
        async for item in cursor:
            output.append(mongo_to_public(item))
        return output

    async def list_history(self, limit: int = 200) -> list[dict]:
        cursor = self.logs.find({}, sort=[("ingested_at", -1)]).limit(limit)
        output: list[dict] = []
        async for item in cursor:
            output.append(mongo_to_public(item))
        return output

    async def run_due_schedules(self) -> int:
        now = datetime.now(timezone.utc)
        due_items = self.schedules.find({"status": "active", "next_run": {"$lte": now}})

        executed = 0
        async for schedule in due_items:
            source_name = schedule["source_name"]
            latest_file = self._find_latest_file(source_name)

            if latest_file is None:
                await self.logs.insert_one(
                    {
                        "source_name": source_name,
                        "file_path": "",
                        "format": "unknown",
                        "record_count": 0,
                        "ingested_at": now,
                        "status": "failed",
                        "error_message": f"No matching file found in {settings.raw_data_dir}",
                        "trigger": "scheduled",
                    }
                )
            else:
                suffix = latest_file.suffix.lower()
                await self.logs.insert_one(
                    {
                        "source_name": source_name,
                        "file_path": str(latest_file),
                        "format": suffix.removeprefix("."),
                        "record_count": self._count_records(latest_file, suffix),
                        "ingested_at": now,
                        "status": "success",
                        "error_message": None,
                        "trigger": "scheduled",
                    }
                )

            next_run = now + timedelta(minutes=int(schedule.get("interval_minutes", 60)))
            await self.schedules.update_one(
                {"_id": schedule["_id"]},
                {
                    "$set": {
                        "next_run": next_run,
                        "last_run": now,
                        "updated_at": now,
                    }
                },
            )
            executed += 1

        return executed

    def _find_latest_file(self, source_name: str) -> Path | None:
        patterns = [
            f"*{source_name}*.csv",
            f"*{source_name}*.json",
            "*.csv" if source_name.strip().lower() == "berkeleyearth" else None,
        ]
        candidates: list[Path] = []
        for pattern in patterns:
            if pattern is None:
                continue
            candidates.extend(settings.raw_data_dir.glob(pattern))

        if not candidates:
            return None
        return max(candidates, key=lambda p: p.stat().st_mtime)

    def _count_records(self, path: Path, suffix: str) -> int:
        if suffix == ".csv":
            with path.open("r", encoding="utf-8", errors="ignore", newline="") as csv_file:
                row_count = sum(1 for _ in csv.reader(csv_file))
                return max(row_count - 1, 0)

        with path.open("r", encoding="utf-8", errors="ignore") as json_file:
            payload = json.load(json_file)
            if isinstance(payload, list):
                return len(payload)
            if isinstance(payload, dict):
                return 1
            return 0
