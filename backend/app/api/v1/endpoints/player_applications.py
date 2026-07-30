from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import CurrentUser, require_league_leadership
from app.dependencies.dependencies import get_db
from app.dependencies.email_verification import require_application_submit_token
from app.schemas.application import (
    ApplicationReview,
    PlayerProfileApplicationCreate,
    PlayerProfileApplicationListResponse,
    PlayerProfileApplicationResponse,
)
from app.services.application_service import ApplicationService
from app.services.email_verification_token import EmailVerificationTokenPayload

router = APIRouter(prefix="/player-applications", tags=["Player Applications"])
service = ApplicationService()


@router.get("/", response_model=PlayerProfileApplicationListResponse, summary="List player applications")
async def list_player_applications(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    filter: list[str] | None = Query(default=None, alias="filter"),
):
    filters = parse_filters(filter)
    items = await service.list_player_applications(
        db,
        current_user,
        filters=filters,
        page=page,
        page_size=page_size,
    )
    total = await service.count_player_applications(db, current_user, filters=filters)
    return {
        "items": [PlayerProfileApplicationResponse.model_validate(item) for item in items],
        "total": total,
    }


@router.get("/{item_id}", response_model=PlayerProfileApplicationResponse, summary="Get player application")
async def get_player_application(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
):
    application = await service.get_player_application(db, current_user, item_id)
    return PlayerProfileApplicationResponse.model_validate(application)


@router.post(
    "/",
    response_model=PlayerProfileApplicationResponse,
    status_code=201,
    summary="Submit player profile application",
)
async def submit_player_application(
    payload: PlayerProfileApplicationCreate,
    db: AsyncSession = Depends(get_db),
    verification: EmailVerificationTokenPayload = Depends(require_application_submit_token),
):
    application = await service.submit_player_application(db, payload, verification)
    return PlayerProfileApplicationResponse.model_validate(application)


@router.patch("/{item_id}", response_model=PlayerProfileApplicationResponse, summary="Review player application")
async def review_player_application(
    item_id: UUID,
    payload: ApplicationReview,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
):
    application = await service.review_player_application(db, current_user, item_id, payload)
    return PlayerProfileApplicationResponse.model_validate(application)
