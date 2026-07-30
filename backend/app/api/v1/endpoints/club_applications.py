from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import CurrentUser, require_league_leadership
from app.dependencies.dependencies import get_db
from app.dependencies.email_verification import require_application_submit_token
from app.schemas.application import (
    ApplicationReview,
    ClubCaptainApplicationCreate,
    ClubCaptainApplicationListResponse,
    ClubCaptainApplicationResponse,
    PlayerProfileApplicationCreate,
    PlayerProfileApplicationListResponse,
    PlayerProfileApplicationResponse,
)
from app.services.application_service import ApplicationService
from app.services.email_verification_token import EmailVerificationTokenPayload

router = APIRouter(prefix="/club-applications", tags=["Club Applications"])
service = ApplicationService()


def _map_club_application(application, *, league_name: str | None = None) -> ClubCaptainApplicationResponse:
    data = ClubCaptainApplicationResponse.model_validate(application)
    return data.model_copy(update={"league_name": league_name})


@router.get("/", response_model=ClubCaptainApplicationListResponse, summary="List club applications")
async def list_club_applications(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    filter: list[str] | None = Query(default=None, alias="filter"),
):
    filters = parse_filters(filter)
    items = await service.list_club_applications(
        db,
        current_user,
        filters=filters,
        page=page,
        page_size=page_size,
    )
    total = await service.count_club_applications(db, current_user, filters=filters)
    league_names: dict[UUID, str | None] = {}
    mapped = []
    for item in items:
        if item.league_id not in league_names:
            league_names[item.league_id] = await service.league_name_for(db, item.league_id)
        mapped.append(_map_club_application(item, league_name=league_names[item.league_id]))
    return {"items": mapped, "total": total}


@router.get("/{item_id}", response_model=ClubCaptainApplicationResponse, summary="Get club application")
async def get_club_application(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
):
    application = await service.get_club_application(db, current_user, item_id)
    league_name = await service.league_name_for(db, application.league_id)
    return _map_club_application(application, league_name=league_name)


@router.post(
    "/",
    response_model=ClubCaptainApplicationResponse,
    status_code=201,
    summary="Submit club captain application",
)
async def submit_club_application(
    payload: ClubCaptainApplicationCreate,
    db: AsyncSession = Depends(get_db),
    verification: EmailVerificationTokenPayload = Depends(require_application_submit_token),
):
    application = await service.submit_club_application(db, payload, verification)
    league_name = await service.league_name_for(db, application.league_id)
    return _map_club_application(application, league_name=league_name)


@router.patch("/{item_id}", response_model=ClubCaptainApplicationResponse, summary="Review club application")
async def review_club_application(
    item_id: UUID,
    payload: ApplicationReview,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
):
    application = await service.review_club_application(db, current_user, item_id, payload)
    league_name = await service.league_name_for(db, application.league_id)
    return _map_club_application(application, league_name=league_name)
