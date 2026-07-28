from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.dependencies import get_db
from app.dependencies.auth import CurrentUser, require_federation_admin
from app.schemas.league import (
    LeagueCreate,
    LeagueListResponse,
    LeagueResponse,
)
from app.services.league_services import LeagueService

router = APIRouter(prefix="/leagues", tags=["Leagues"])

service = LeagueService()


@router.get(
    "/",
    response_model=LeagueListResponse,
    summary="List leagues",
)
async def list_leagues(
    db: AsyncSession = Depends(get_db),
):
    leagues = await service.list(db)

    return {
        "items": leagues,
        "total": len(leagues),
    }


@router.post(
    "/",
    response_model=LeagueResponse,
    summary="Create league",
    status_code=201,
)
async def create_league(
    payload: LeagueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(
        db,
        payload,
    )
