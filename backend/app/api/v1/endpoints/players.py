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
from app.schemas.external_accounts import (
    PlayerExternalAccountComparison,
    VerificationCodeResponse,
    VerificationResult,
)
from app.schemas.player import (
    PlayerCreate,
    PlayerListResponse,
    PlayerResponse,
    PlayerUpdate
)
from app.services.authorization_service import AuthorizationService
from app.services.chesscom_service import ChessComService
from app.services.lichess_service import LichessService
from app.services.player_service import PlayerService

router = APIRouter(prefix='/players', tags=['Players'])
service = PlayerService()
lichess_service = LichessService()
chesscom_service = ChessComService()
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


@router.get(
    '/{item_id}/lichess',
    response_model=PlayerExternalAccountComparison,
    summary='Compare player Lichess profile with stored ratings',
)
async def get_player_lichess_profile(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_read_player_with_clubs(db, current_user, player)
    return await lichess_service.compare_player(player)


@router.post('/{item_id}/lichess/sync', response_model=PlayerResponse, summary='Sync player ratings from Lichess')
async def sync_player_lichess_ratings(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    return await lichess_service.sync_player_ratings(db, item_id)


@router.get(
    '/{item_id}/lichess/verify',
    response_model=VerificationCodeResponse,
    summary='Get Lichess verification code',
)
async def request_player_lichess_verification(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    return await lichess_service.request_verification(db, player)


@router.post(
    '/{item_id}/lichess/verify/admin',
    response_model=VerificationResult,
    summary='Admin-attest Lichess account ownership',
)
async def admin_verify_player_lichess(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    authz.ensure_can_admin_verify_external_account(current_user)
    await authz.ensure_can_read_player_with_clubs(db, current_user, player)
    return await lichess_service.admin_verify(db, player)


@router.post(
    '/{item_id}/lichess/verify',
    response_model=VerificationResult,
    summary='Confirm Lichess ownership via profile bio code',
)
async def confirm_player_lichess_verification(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    return await lichess_service.confirm_verification(db, player)


@router.get(
    '/{item_id}/chesscom',
    response_model=PlayerExternalAccountComparison,
    summary='Compare player Chess.com profile with stored ratings',
)
async def get_player_chesscom_profile(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_read_player_with_clubs(db, current_user, player)
    return await chesscom_service.compare_player(player)


@router.post('/{item_id}/chesscom/sync', response_model=PlayerResponse, summary='Sync player ratings from Chess.com')
async def sync_player_chesscom_ratings(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    return await chesscom_service.sync_player_ratings(db, item_id)


@router.get(
    '/{item_id}/chesscom/verify',
    response_model=VerificationCodeResponse,
    summary='Get Chess.com verification code',
)
async def request_player_chesscom_verification(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    return await chesscom_service.request_verification(db, player)


@router.post(
    '/{item_id}/chesscom/verify/admin',
    response_model=VerificationResult,
    summary='Admin-attest Chess.com account ownership',
)
async def admin_verify_player_chesscom(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    authz.ensure_can_admin_verify_external_account(current_user)
    await authz.ensure_can_read_player_with_clubs(db, current_user, player)
    return await chesscom_service.admin_verify(db, player)


@router.post(
    '/{item_id}/chesscom/verify',
    response_model=VerificationResult,
    summary='Confirm Chess.com ownership via display name match',
)
async def confirm_player_chesscom_verification(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    return await chesscom_service.confirm_verification(db, player)


@router.patch('/{item_id}', response_model=PlayerResponse, summary='Update Player')
async def update_player(
    item_id: UUID,
    payload: PlayerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
    sync_lichess: bool = Query(False, description='Sync ratings when lichess_username changes'),
    sync_chesscom: bool = Query(False, description='Sync ratings when chesscom_username changes'),
):
    payload_data = payload.model_dump(exclude_unset=True)
    return await service.update(
        db,
        item_id,
        payload_data,
        sync_lichess=sync_lichess,
        sync_chesscom=sync_chesscom,
    )


@router.delete('/{item_id}', status_code=204, summary='Delete Player')
async def delete_player(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    await service.delete(db, item_id)
    return Response(status_code=204)
