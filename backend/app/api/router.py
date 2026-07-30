from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.endpoints import (
    application_status,
    audit_logs,
    auth_otp,
    clubs,
    club_members,
    dashboard,
    documents,
    integrations,
    leagues,
    notifications,
    players,
    registrations,
    seasons,
    transfer_approvals,
    transfers,
    user_profiles,
)

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_otp.router)
api_router.include_router(application_status.router)
api_router.include_router(leagues.router)
api_router.include_router(clubs.router)
api_router.include_router(seasons.router)
api_router.include_router(user_profiles.router)
api_router.include_router(players.router)
api_router.include_router(club_members.router)
api_router.include_router(registrations.router)
api_router.include_router(transfers.router)
api_router.include_router(transfer_approvals.router)
api_router.include_router(documents.router)
api_router.include_router(notifications.router)
api_router.include_router(audit_logs.router)
api_router.include_router(dashboard.router)
api_router.include_router(integrations.router)
