from fastapi import FastAPI

from app.api import api_router
from app.core.config import settings
from app.db.seed import seed_initial_data
from app.db.session import init_db


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version=settings.version,
        openapi_url="/api/openapi.json",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )

    application.include_router(api_router)

    return application


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    seed_initial_data()


@app.get("/healthz", tags=["health"])
def read_health() -> dict[str, str]:
    """
    Lightweight health check endpoint used for readiness probes.
    """
    return {"status": "ok"}

