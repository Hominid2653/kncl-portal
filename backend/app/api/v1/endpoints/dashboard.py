from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import (
    CurrentUser,
    require_authenticated,
    require_club_leadership,
    require_league_leadership,
)
from app.dependencies.dependencies import get_db
from app.schemas.dashboard import (
    AdminDashboardResponse,
    ClubDashboardResponse,
    PlayerDashboardResponse,
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix='/dashboard', tags=['Dashboard'])
service = DashboardService()


@router.get('/admin', response_model=AdminDashboardResponse, summary='Admin dashboard')
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
):
    return await service.get_admin_dashboard(db, current_user)


@router.get('/club', response_model=ClubDashboardResponse, summary='Club dashboard')
async def get_club_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    return await service.get_club_dashboard(db, current_user)


@router.get('/player', response_model=PlayerDashboardResponse, summary='Player dashboard')
async def get_player_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    return await service.get_player_dashboard(db, current_user)
