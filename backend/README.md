# EarthScape Backend

FastAPI + MongoDB + PySpark backend implementation for the EarthScape climate analytics platform.

## Features implemented
- JWT auth with bcrypt passwords and role-based route protection (`admin`, `analyst`, `viewer`)
- User management endpoints (`/api/users`)
- Data ingestion upload/schedule/history endpoints
- Spark batch job trigger and status tracking
- ML model listing and anomaly prediction endpoints
- Open-Meteo live weather fetch + immediate anomaly inference
- Alerts configuration, listing, acknowledgement, WebSocket broadcast, SMTP email hook
- Support ticket submission and admin updates

## Structure
- `app/` - FastAPI application (routes, services, models, core)
- `spark_jobs/` - PySpark batch + streaming scripts
- `ml/` - model utilities and stored model artifacts
- `scripts/` - helper scripts

## Setup
1. Create and activate a virtual environment in `backend/`.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill secrets.
4. Ensure MongoDB is running locally.
5. Start API:
   - `uvicorn app.main:app --reload --port 8000`
6. Visit Swagger docs:
   - `http://localhost:8000/docs`

## Core endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/ingest/upload`
- `POST /api/ingest/schedule`
- `GET /api/ingest/history`
- `POST /api/spark/run-job`
- `GET /api/spark/jobs`
- `GET /api/ml/models`
- `POST /api/ml/predict`
- `POST /api/ml/live-weather`
- `GET /api/alerts`
- `POST /api/alerts/configure`
- `PATCH /api/alerts/{alert_id}/acknowledge`
- `POST /api/support/ticket`
- `GET /api/support/tickets`
- `PATCH /api/support/tickets/{ticket_id}`

## Dataset workflow
Use the notebook `notebooks/01_dataset_download.ipynb` to download the Berkeley Earth dataset via `kagglehub` and copy source CSV files to `data/raw/`.

## Spark jobs
- `clean_data.py`
- `aggregate_stats.py`
- `pattern_detection.py`
- `correlation_analysis.py`
- `anomaly_batch.py`
- `retrain_models.py`
- `stream_ingest.py`
