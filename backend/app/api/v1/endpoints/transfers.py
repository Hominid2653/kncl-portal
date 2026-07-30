from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import (
    CurrentUser,
    require_authenticated,
    require_club_leadership,
    require_league_leadership,
)
from app.dependencies.dependencies import get_db
from app.models.enums import TransferSource
from app.schemas.transfer import (
    TransferAction,
    TransferCreate,
    TransferListResponse,
    TransferPlayerRequest,
    TransferResponse,
    TransferUpdate,
)
from app.services.authorization_service import AuthorizationService
from app.services.transfer_service import TransferService

router = APIRouter(prefix='/transfers', tags=['Transfers'])
service = TransferService()
authz = AuthorizationService()


@router.get('/', response_model=TransferListResponse, summary='List Transfers')
async def list_transfer(
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
    filters = await authz.scope_transfer_filters(db, current_user, filters)
    return await service.list(
        db,
        filters=filters,
        search=search,
        search_fields=['reason', 'status'],
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.post('/', response_model=TransferResponse, summary='Submit Transfer', status_code=201)
async def create_transfer(
    payload: TransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    await authz.ensure_can_manage_club_by_id(db, current_user, payload.from_club_id)
    return await service.submit(db, payload, current_user)


@router.post(
    '/player-request',
    response_model=TransferResponse,
    summary='Submit player transfer request',
    status_code=201,
)
async def create_player_transfer_request(
    payload: TransferPlayerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await authz.get_player_for_user(db, current_user)
    if not player:
        from app.core.exceptions import Forbidden

        raise Forbidden("No player profile is linked to this account.")

    transfer_payload = TransferCreate(
        from_club_id=payload.from_club_id,
        to_club_id=payload.to_club_id,
        reason=payload.reason,
        source=TransferSource.PLAYER_REQUEST,
        player_id=player.id,
    )
    return await service.submit(db, transfer_payload, current_user)


@router.post(
    '/{item_id}/approve',
    response_model=TransferResponse,
    summary='Approve Transfer',
)
async def approve_transfer(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
    payload: TransferAction = Body(default_factory=TransferAction),
):
    transfer = await service.get(db, item_id)
    await authz.ensure_can_read_transfer(db, current_user, transfer)
    return await service.approve(db, item_id, current_user, payload)


@router.post(
    '/{item_id}/reject',
    response_model=TransferResponse,
    summary='Reject Transfer',
)
async def reject_transfer(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
    payload: TransferAction = Body(default_factory=TransferAction),
):
    transfer = await service.get(db, item_id)
    await authz.ensure_can_read_transfer(db, current_user, transfer)
    return await service.reject(db, item_id, current_user, payload)


@router.post(
    '/{item_id}/cancel',
    response_model=TransferResponse,
    summary='Cancel Transfer',
)
async def cancel_transfer(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
    payload: TransferAction = Body(default_factory=TransferAction),
):
    transfer = await service.get(db, item_id)
    await authz.ensure_can_manage_club_by_id(db, current_user, transfer.from_club_id)
    return await service.cancel(db, item_id, current_user, payload)


@router.get('/{item_id}', response_model=TransferResponse, summary='Get Transfer by id')
async def get_transfer(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    item = await service.get(db, item_id)
    await authz.ensure_can_read_transfer(db, current_user, item)
    return item


@router.patch('/{item_id}', response_model=TransferResponse, summary='Update Transfer reason')
async def update_transfer(
    item_id: UUID,
    payload: TransferUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    transfer = await service.get(db, item_id)
    await authz.ensure_can_manage_club_by_id(db, current_user, transfer.from_club_id)
    return await service.update_pending_reason(db, item_id, payload)
