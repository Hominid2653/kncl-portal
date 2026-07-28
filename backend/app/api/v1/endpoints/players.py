from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import (
    CurrentUser,
    require_authenticated,
    require_club_leadership,
    require_federation_admin
)
from app.dependencies.dependencies import get_db
from app.schemas.player import (
    PlayerCreate,
    PlayerListResponse,
    PlayerResponse,
    PlayerUpdate
)
from app.schemas.lichess import LichessUserResponse
from app.services.authorization_service import AuthorizationService
from app.services.lichess_service import LichessService
from app.services.player_service import PlayerService

router = APIRouter(prefix='/players', tags=['Players'])
service = PlayerService()
lichess_service = LichessService()
authz = AuthorizationService()


@router.get('/', response_model=PlayerListResponse, summary='List Players')
async def list_player(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
    page: int = Query(1, ge=1, description='Page number'),
    page_size: int = Query(20, ge=1, le=100, description='Items per page'),
    sort_by: str | None = Query(None, description='Field to sort by'),
    sort_order: str = Query('asc', pattern='^(asc|desc)$', description='Sort direction'),
    search: str | None = Query(None, description='Search term'),
    filter: list[str] | None = Query(default=None, alias='filter', description='Filter as field=value'),
):
    filters = parse_filters(filter)
    filters = await authz.scope_player_filters(db, current_user, filters)
    return await service.list(
        db,
        filters=filters,
        search=search,
        search_fields=['federation_id', 'fide_id', 'chesscom_username', 'lichess_username', 'nationality'],
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get('/{item_id}', response_model=PlayerResponse, summary='Get Player by id')
async def get_player(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    item = await service.get(db, item_id)
    await authz.ensure_can_read_player_with_clubs(db, current_user, item)
    return item


@router.post('/', response_model=PlayerResponse, summary='Create Player', status_code=201)
async def create_player(
    payload: PlayerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    return await service.create(db, payload)


@router.get('/{item_id}/lichess', response_model=LichessUserResponse, summary='Get player Lichess profile')
async def get_player_lichess_profile(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_read_player_with_clubs(db, current_user, player)
    return await lichess_service.lookup_player(player)


@router.post(
    '/{item_id}/lichess/sync',
    response_model=PlayerResponse,
    summary='Sync player ratings from Lichess',
)
async def sync_player_lichess_ratings(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_read_player_with_clubs(db, current_user, player)
    return await lichess_service.sync_player_ratings(db, item_id)


@router.patch('/{item_id}', response_model=PlayerResponse, summary='Update Player')
async def update_player(
    item_id: UUID,
    payload: PlayerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    payload_data = payload.model_dump(exclude_unset=True)
    return await service.update(db, item_id, payload_data)


@router.delete('/{item_id}', status_code=204, summary='Delete Player')
async def delete_player(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    await service.delete(db, item_id)
    return Response(status_code=204)
