from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.endpoints import leagues

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(leagues.router)