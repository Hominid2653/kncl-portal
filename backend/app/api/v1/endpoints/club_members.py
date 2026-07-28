from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import (
    CurrentUser,
    require_authenticated,
    require_club_leadership
)
from app.dependencies.dependencies import get_db
from app.schemas.club_member import (
    ClubMemberCreate,
    ClubMemberListResponse,
    ClubMemberResponse,
    ClubMemberUpdate
)
from app.services.authorization_service import AuthorizationService
from app.services.club_member_service import ClubMemberService

router = APIRouter(prefix='/club-members', tags=['Club Members'])
service = ClubMemberService()
authz = AuthorizationService()


@router.get('/', response_model=ClubMemberListResponse, summary='List Club Members')
async def list_club_member(
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
    filters = await authz.scope_club_member_filters(db, current_user, filters)
    return await service.list(
        db,
        filters=filters,
        search=search,
        search_fields=['position'],
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get('/{item_id}', response_model=ClubMemberResponse, summary='Get Club Member by id')
async def get_club_member(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    item = await service.get(db, item_id)
    await authz.ensure_can_read_club_member(db, current_user, item)
    return item


@router.post('/', response_model=ClubMemberResponse, summary='Create Club Member', status_code=201)
async def create_club_member(
    payload: ClubMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    await authz.ensure_can_manage_club_by_id(db, current_user, payload.club_id)
    return await service.create(db, payload)


@router.patch('/{item_id}', response_model=ClubMemberResponse, summary='Update Club Member')
async def update_club_member(
    item_id: UUID,
    payload: ClubMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    payload_data = payload.model_dump(exclude_unset=True)
    item = await service.get(db, item_id)
    await authz.ensure_can_manage_club_member(db, current_user, item)
    return await service.update(db, item_id, payload_data)


@router.delete('/{item_id}', status_code=204, summary='Delete Club Member')
async def delete_club_member(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    item = await service.get(db, item_id)
    await authz.ensure_can_manage_club_member(db, current_user, item)
    await service.delete(db, item_id)
    return Response(status_code=204)
