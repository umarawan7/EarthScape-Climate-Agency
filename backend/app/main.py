import asyncio
from datetime import datetime

from fastapi import BackgroundTasks, Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import ensure_directories, settings
from app.core.database import db
from app.core.websocket_manager import ws_manager
from app.routes import alerts, auth, climate, ingest, ml, spark, support, users

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    ensure_directories()
    await db.connect()

    users_collection = db.get_collection("users")
    alerts_collection = db.get_collection("alerts")
    ingestion_collection = db.get_collection("ingestion_logs")

    await users_collection.create_index("email", unique=True)
    await alerts_collection.create_index([("triggered_at", -1)])
    await ingestion_collection.create_index([("ingested_at", -1)])


@app.on_event("shutdown")
async def on_shutdown() -> None:
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
