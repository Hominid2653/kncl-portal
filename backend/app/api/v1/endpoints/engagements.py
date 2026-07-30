from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import (
    CurrentUser,
    require_authenticated,
    require_club_admin,
)
from app.dependencies.dependencies import get_db
from app.models.enums import EngagementStatus, UserRole
from app.schemas.engagement import (
    EngagementCreate,
    EngagementListResponse,
    EngagementResponse,
    EngagementUpdate,
)
from app.services.authorization_service import AuthorizationService
from app.services.engagement_service import EngagementService

router = APIRouter(prefix="/engagements", tags=["Engagements"])
service = EngagementService()
authz = AuthorizationService()


@router.get("/", response_model=EngagementListResponse, summary="List engagements")
async def list_engagements(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str | None = Query(None),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    filter: list[str] | None = Query(default=None, alias="filter"),
):
    filters = parse_filters(filter)
    if current_user.role is UserRole.PLAYER:
        player = await authz.get_player_for_user(db, current_user)
        if player:
            filters["player_id"] = str(player.id)
    elif current_user.role is UserRole.CLUB_ADMIN:
        club_ids = await authz.get_club_ids_for_user(db, current_user)
        if club_ids:
            filters["requesting_club_id"] = [str(club_id) for club_id in club_ids]
    return await service.list(
        db,
        filters=filters,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get("/{item_id}", response_model=EngagementResponse, summary="Get engagement")
async def get_engagement(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    return await service.get(db, item_id)


@router.post("/", response_model=EngagementResponse, summary="Express interest in a player", status_code=201)
async def create_engagement(
    payload: EngagementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_admin),
):
    return await service.create(db, payload, current_user)


@router.patch("/{item_id}", response_model=EngagementResponse, summary="Respond to engagement")
async def update_engagement(
    item_id: UUID,
    payload: EngagementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    if payload.status is None:
        from app.core.exceptions import ValidationError

        raise ValidationError("status is required.")
    return await service.update_status(db, item_id, payload, current_user)
