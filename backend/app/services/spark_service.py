import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId

from app.core.config import settings
from app.core.database import db
from app.core.serialization import mongo_to_public


class SparkService:
    JOBS = {
        "clean_data": "clean_data.py",
        "aggregate_stats": "aggregate_stats.py",
        "pattern_detection": "pattern_detection.py",
        "correlation_analysis": "correlation_analysis.py",
        "anomaly_batch": "anomaly_batch.py",
        "retrain_models": "retrain_models.py",
    }

    def __init__(self) -> None:
        self.collection = db.get_collection("spark_jobs")

    async def submit_job(self, job_name: str, input_path: str | None) -> dict:
        if job_name not in self.JOBS:
            raise ValueError(f"Unsupported Spark job: {job_name}")

        job_doc = {
            "job_name": job_name,
            "status": "queued",
            "input_path": input_path,
            "output_path": None,
            "started_at": datetime.now(timezone.utc),
            "finished_at": None,
            "logs": None,
        }
        result = await self.collection.insert_one(job_doc)
        created = await self.collection.find_one({"_id": result.inserted_id})
        return mongo_to_public(created)

    async def execute_job(self, job_id: str) -> None:
        try:
            job_object_id = ObjectId(job_id)
        except Exception:
            return

        doc = await self.collection.find_one({"_id": job_object_id})
        if not doc:
            return

        script_name = self.JOBS[doc["job_name"]]
        script_path = settings.repo_root / "backend" / "spark_jobs" / script_name
        input_path = doc.get("input_path") or str(settings.raw_data_dir)

        output_path = str(settings.processed_data_dir / f"{doc['job_name']}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}")

        await self.collection.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "status": "running",
                    "output_path": output_path,
                    "started_at": datetime.now(timezone.utc),
                }
            },
        )

        process = await asyncio.create_subprocess_exec(
            sys.executable,
            str(script_path),
            "--input",
            input_path,
            "--output",
            output_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(settings.repo_root / "backend"),
        )

        stdout, stderr = await process.communicate()
        logs = (stdout or b"").decode("utf-8", errors="ignore") + "\n" + (stderr or b"").decode("utf-8", errors="ignore")

        await self.collection.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "status": "completed" if process.returncode == 0 else "failed",
                    "logs": logs.strip(),
                    "finished_at": datetime.now(timezone.utc),
                }
            },
        )

    async def list_jobs(self, limit: int = 100) -> list[dict]:
        cursor = self.collection.find({}, sort=[("started_at", -1)]).limit(limit)
        jobs: list[dict] = []
        async for item in cursor:
            jobs.append(mongo_to_public(item))
        return jobs
