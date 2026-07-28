from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query, Response
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
from app.schemas.registration import (
    RegistrationAction,
    RegistrationCreate,
    RegistrationListResponse,
    RegistrationResponse,
)
from app.services.authorization_service import AuthorizationService
from app.services.registration_service import RegistrationService

router = APIRouter(prefix='/registrations', tags=['Registrations'])
service = RegistrationService()
authz = AuthorizationService()


@router.get('/', response_model=RegistrationListResponse, summary='List Registrations')
async def list_registration(
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
    filters = await authz.scope_registration_filters(db, current_user, filters)
    return await service.list(
        db,
        filters=filters,
        search=search,
        search_fields=['status'],
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.post('/', response_model=RegistrationResponse, summary='Submit Registration', status_code=201)
async def create_registration(
    payload: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    await authz.ensure_can_manage_club_by_id(db, current_user, payload.club_id)
    return await service.submit(db, payload, current_user)


@router.post(
    '/{item_id}/approve',
    response_model=RegistrationResponse,
    summary='Approve Registration',
)
async def approve_registration(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
    payload: RegistrationAction = Body(default_factory=RegistrationAction),
):
    registration = await service.get(db, item_id)
    await authz.ensure_can_read_registration(db, current_user, registration)
    return await service.approve(db, item_id, current_user, payload)


@router.post(
    '/{item_id}/reject',
    response_model=RegistrationResponse,
    summary='Reject Registration',
)
async def reject_registration(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_league_leadership),
    payload: RegistrationAction = Body(default_factory=RegistrationAction),
):
    registration = await service.get(db, item_id)
    await authz.ensure_can_read_registration(db, current_user, registration)
    return await service.reject(db, item_id, current_user, payload)


@router.get('/{item_id}', response_model=RegistrationResponse, summary='Get Registration by id')
async def get_registration(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    item = await service.get(db, item_id)
    await authz.ensure_can_read_registration(db, current_user, item)
    return item


@router.delete('/{item_id}', status_code=204, summary='Delete Registration')
async def delete_registration(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    await service.delete(db, item_id)
    return Response(status_code=204)
