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
        "stream_ingest": "stream_ingest.py",
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

    async def load_processed(self, job_id: str) -> dict:
        import pandas as pd
        import numpy as np
        from bson import ObjectId
        from fastapi import HTTPException

        try:
            job_object_id = ObjectId(job_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid job ID format") from exc

        doc = await self.collection.find_one({"_id": job_object_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Spark job not found")

        if doc["status"] != "completed":
            raise HTTPException(status_code=400, detail=f"Cannot load data for job with status: {doc['status']}")

        output_path = doc.get("output_path")
        if not output_path or not Path(output_path).exists():
            raise HTTPException(status_code=404, detail="Job output path does not exist")

        parquet_files = list(Path(output_path).glob("part-*.parquet"))
        if not parquet_files:
            raise HTTPException(status_code=404, detail="No Parquet output files found in job directory")

        dfs = []
        for pf in parquet_files:
            dfs.append(pd.read_parquet(pf))
        if not dfs:
            return {"message": "No data found", "loaded_count": 0}
        df = pd.concat(dfs, ignore_index=True)

        df = df.replace({np.nan: None})

        records_count = 0
        anomalies_count = 0
        job_name = doc["job_name"]

        if job_name in ("clean_data", "anomaly_batch"):
            climate_records_coll = db.get_collection("climate_records")
            anomalies_coll = db.get_collection("anomalies")

            docs_to_insert = []
            anomaly_docs = []

            for _, row in df.iterrows():
                temp = row.get("temperature_c", None)
                if temp is None:
                    continue

                dt_val = row.get("date", None)
                if isinstance(dt_val, pd.Timestamp):
                    timestamp = dt_val.to_pydatetime().replace(tzinfo=timezone.utc)
                elif isinstance(dt_val, datetime):
                    timestamp = dt_val.replace(tzinfo=timezone.utc)
                else:
                    timestamp = datetime.now(timezone.utc)

                lat = row.get("latitude_num", row.get("latitude", 0.0))
                lon = row.get("longitude_num", row.get("longitude", 0.0))

                city = row.get("city", "")
                country = row.get("country", "")
                region_parts = [p for p in [city, country] if p]
                region = ", ".join(region_parts) if region_parts else "Global"

                doc_id = ObjectId()
                climate_doc = {
                    "_id": doc_id,
                    "source": f"spark_{job_name}",
                    "region": region,
                    "latitude": float(lat) if lat is not None else 0.0,
                    "longitude": float(lon) if lon is not None else 0.0,
                    "timestamp": timestamp,
                    "temperature": float(temp),
                    "data_type": "observed"
                }
                docs_to_insert.append(climate_doc)

                is_anomaly = row.get("is_anomaly", False)
                if is_anomaly:
                    anomaly_doc = {
                        "record_id": str(doc_id),
                        "anomaly_type": "temperature",
                        "severity": "high" if abs(row.get("z_score", 0.0)) > 4.0 else "medium",
                        "detected_at": datetime.now(timezone.utc),
                        "description": f"Batch anomaly detected. Z-score: {row.get('z_score', 3.0):.2f}. Temp: {temp}°C"
                    }
                    anomaly_docs.append(anomaly_doc)

            if docs_to_insert:
                await climate_records_coll.insert_many(docs_to_insert)
                records_count = len(docs_to_insert)
            if anomaly_docs:
                await anomalies_coll.insert_many(anomaly_docs)
                anomalies_count = len(anomaly_docs)

        elif job_name == "aggregate_stats":
            stats_coll = db.get_collection("aggregate_stats")
            docs_to_insert = []
            for _, row in df.iterrows():
                country = row.get("country", "unknown")
                year = row.get("year", None)
                avg_temp = row.get("avg_temperature_c", None)
                min_temp = row.get("min_temperature_c", None)
                max_temp = row.get("max_temperature_c", None)
                rec_count = row.get("record_count", 0)

                docs_to_insert.append({
                    "country": country,
                    "year": int(year) if year is not None else None,
                    "avg_temperature_c": float(avg_temp) if avg_temp is not None else None,
                    "min_temperature_c": float(min_temp) if min_temp is not None else None,
                    "max_temperature_c": float(max_temp) if max_temp is not None else None,
                    "record_count": int(rec_count)
                })
            if docs_to_insert:
                await stats_coll.insert_many(docs_to_insert)
                records_count = len(docs_to_insert)

        else:
            generic_coll = db.get_collection(f"spark_output_{job_name}")
            docs_to_insert = [row.to_dict() for _, row in df.iterrows()]
            if docs_to_insert:
                await generic_coll.insert_many(docs_to_insert)
                records_count = len(docs_to_insert)

        await self.collection.update_one(
            {"_id": job_object_id},
            {"$set": {"loaded_to_db": True, "loaded_count": records_count}}
        )

        return {
            "message": "Data loaded to MongoDB successfully",
            "job_name": job_name,
            "records_loaded": records_count,
            "anomalies_loaded": anomalies_count
        }

