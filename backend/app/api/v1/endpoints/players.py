from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import (
    CurrentUser,
    require_authenticated,
    require_club_leadership,
    require_federation_admin,
    require_league_leadership,
)
from app.dependencies.dependencies import get_db
from app.models.enums import PlayerCommitmentStatus, TransferSource
from app.schemas.external_accounts import (
    PlayerExternalAccountComparison,
    VerificationCodeResponse,
    VerificationResult,
)
from app.schemas.player import (
    PlayerCreate,
    PlayerExternalAccountUpdate,
    PlayerListResponse,
    PlayerResponse,
    PlayerUpdate
)
from app.schemas.headshot import HeadshotModerationUpdate, HeadshotResponse, HeadshotUpdate, PendingHeadshotListResponse
from app.schemas.player_listing import PlayerListingResponse
from app.services.authorization_service import AuthorizationService
from app.services.chesscom_service import ChessComService
from app.services.engagement_service import PlayerListingService
from app.services.headshot_service import HeadshotService
from app.services.lichess_service import LichessService
from app.services.fide_service import FideService
from app.services.rating_sync_service import RatingSyncService
from app.services.player_service import PlayerService

router = APIRouter(prefix='/players', tags=['Players'])
service = PlayerService()
listing_service = PlayerListingService()
lichess_service = LichessService()
chesscom_service = ChessComService()
fide_service = FideService()
rating_sync_service = RatingSyncService()
authz = AuthorizationService()
headshot_service = HeadshotService()


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


@router.get('/listings', response_model=PlayerListingResponse, summary='Public player listings')
async def list_player_listings(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    commitment_status: PlayerCommitmentStatus | None = Query(None),
    county: str | None = Query(None),
    sort_by: str = Query("name"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
):
    return await listing_service.list_public(
        db,
        page=page,
        page_size=page_size,
        search=search,
        commitment_status=commitment_status,
        county=county,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    '/headshots/pending',
    response_model=PendingHeadshotListResponse,
    summary='List player headshots awaiting moderation',
)
async def list_pending_headshots(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
):
    items = await headshot_service.list_pending(db)
    return {"items": items, "total": len(items)}


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


@router.post(
    '/{item_id}/headshot/upload',
    response_model=HeadshotResponse,
    summary='Upload player headshot image',
    status_code=201,
)
async def upload_player_headshot(
    item_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    content = await file.read()
    updated = await headshot_service.upload_file(
        db,
        item_id,
        filename=file.filename or "headshot.jpg",
        content_type=file.content_type,
        content=content,
    )
    return await headshot_service.to_response(updated)


@router.patch('/{item_id}/headshot', response_model=HeadshotResponse, summary='Update player headshot from URL')
async def update_player_headshot(
    item_id: UUID,
    payload: HeadshotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    updated = await service.update_headshot(
        db,
        item_id,
        headshot_url=str(payload.headshot_url),
        headshot_source=payload.headshot_source,
    )
    return await headshot_service.to_response(updated)


@router.patch(
    '/{item_id}/headshot/moderate',
    response_model=HeadshotResponse,
    summary='Moderate player headshot',
)
async def moderate_player_headshot(
    item_id: UUID,
    payload: HeadshotModerationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
):
    updated = await service.moderate_headshot(
        db,
        item_id,
        moderation_status=payload.headshot_moderation_status,
    )
    return await headshot_service.to_response(updated)


@router.post('/{item_id}/fide/sync', response_model=PlayerResponse, summary='Sync player ratings from FIDE')
async def sync_player_fide_ratings(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    return await fide_service.sync_player_ratings(db, item_id)


@router.post('/{item_id}/ratings/sync', response_model=PlayerResponse, summary='Sync ratings from best linked source')
async def sync_player_ratings(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    updated, _source = await rating_sync_service.sync_best_available(db, item_id)
    return updated


@router.patch(
    '/{item_id}/external-accounts',
    response_model=PlayerResponse,
    summary='Link or update FIDE, Lichess, and Chess.com accounts',
)
async def update_player_external_accounts(
    item_id: UUID,
    payload: PlayerExternalAccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
    sync_fide: bool = Query(False, description='Sync ratings when fide_id changes'),
    sync_lichess: bool = Query(False, description='Sync ratings when lichess_username changes'),
    sync_chesscom: bool = Query(False, description='Sync ratings when chesscom_username changes'),
):
    player = await service.get(db, item_id)
    await authz.ensure_can_manage_player_external_account(db, current_user, player)
    payload_data = payload.model_dump(exclude_unset=True)
    if not payload_data:
        return player
    return await service.update(
        db,
        item_id,
        payload_data,
        sync_fide=sync_fide,
        sync_lichess=sync_lichess,
        sync_chesscom=sync_chesscom,
    )


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
