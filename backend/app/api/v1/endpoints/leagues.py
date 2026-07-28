from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import (
    CurrentUser,
    require_authenticated,
    require_federation_admin
)
from app.dependencies.dependencies import get_db
from app.schemas.league import (
    LeagueCreate,
    LeagueListResponse,
    LeagueResponse,
    LeagueUpdate
)
from app.services.authorization_service import AuthorizationService
from app.services.league_services import LeagueService

router = APIRouter(prefix='/leagues', tags=['Leagues'])
service = LeagueService()
authz = AuthorizationService()


@router.get('/', response_model=LeagueListResponse, summary='List Leagues')
async def list_league(
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
    return await service.list(
        db,
        filters=filters,
        search=search,
        search_fields=['name', 'description'],
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get('/{item_id}', response_model=LeagueResponse, summary='Get League by id')
async def get_league(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    item = await service.get(db, item_id)
    return item


@router.post('/', response_model=LeagueResponse, summary='Create League', status_code=201)
async def create_league(
    payload: LeagueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)


@router.patch('/{item_id}', response_model=LeagueResponse, summary='Update League')
async def update_league(
    item_id: UUID,
    payload: LeagueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    payload_data = payload.model_dump(exclude_unset=True)
    return await service.update(db, item_id, payload_data)


@router.delete('/{item_id}', status_code=204, summary='Delete League')
async def delete_league(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    await service.delete(db, item_id)
    return Response(status_code=204)
