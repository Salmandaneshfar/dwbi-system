from fastapi import APIRouter

from app.api.routes import auth, modules, module_data

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(modules.router, prefix="/modules", tags=["modules"])
api_router.include_router(module_data.router, prefix="/modules", tags=["module-data"])

