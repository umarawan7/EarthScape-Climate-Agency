from datetime import datetime

import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import ensure_directories, settings
from app.core.database import db
from app.core.websocket_manager import ws_manager
from app.routes import alerts, auth, climate, ingest, ml, spark, support, users
from app.services.ingestion_service import IngestionService

app = FastAPI(title=settings.app_name, version=settings.app_version)
schedule_worker_task: asyncio.Task | None = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup() -> None:
    global schedule_worker_task
    ensure_directories()
    await db.connect()

    users_collection = db.get_collection("users")
    alerts_collection = db.get_collection("alerts")
    ingestion_collection = db.get_collection("ingestion_logs")

    await users_collection.create_index("email", unique=True)
    await alerts_collection.create_index([("triggered_at", -1)])
    await ingestion_collection.create_index([("ingested_at", -1)])
    await db.get_collection("ingestion_schedules").create_index([("next_run", 1), ("status", 1)])

    schedule_worker_task = asyncio.create_task(ingestion_schedule_worker())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    global schedule_worker_task
    if schedule_worker_task:
        schedule_worker_task.cancel()
        try:
            await schedule_worker_task
        except asyncio.CancelledError:
            pass
        schedule_worker_task = None
    await db.disconnect()


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


app.include_router(auth.router, prefix=f"{settings.api_v1_prefix}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.api_v1_prefix}/users", tags=["users"])
app.include_router(ingest.router, prefix=f"{settings.api_v1_prefix}/ingest", tags=["ingest"])
app.include_router(spark.router, prefix=f"{settings.api_v1_prefix}/spark", tags=["spark"])
app.include_router(ml.router, prefix=f"{settings.api_v1_prefix}/ml", tags=["ml"])
app.include_router(climate.router, prefix=f"{settings.api_v1_prefix}/climate", tags=["climate"])
app.include_router(alerts.router, prefix=f"{settings.api_v1_prefix}/alerts", tags=["alerts"])
app.include_router(support.router, prefix=f"{settings.api_v1_prefix}/support", tags=["support"])


@app.websocket(f"{settings.api_v1_prefix}/ws/alerts")
async def alert_websocket(websocket: WebSocket) -> None:
    await ws_manager.connect("alerts", websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect("alerts", websocket)
    except Exception:
        ws_manager.disconnect("alerts", websocket)


async def ingestion_schedule_worker() -> None:
    service = IngestionService()
    while True:
        try:
            await service.run_due_schedules()
        except Exception:
            pass
        await asyncio.sleep(30)
