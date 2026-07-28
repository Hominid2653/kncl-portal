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
from app.schemas.notification import (
    NotificationCreate,
    NotificationListResponse,
    NotificationResponse,
    NotificationUpdate
)
from app.services.authorization_service import AuthorizationService
from app.services.notification_service import NotificationService

router = APIRouter(prefix='/notifications', tags=['Notifications'])
service = NotificationService()
authz = AuthorizationService()


@router.get('/', response_model=NotificationListResponse, summary='List Notifications')
async def list_notification(
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
    filters = await authz.scope_notification_filters(db, current_user, filters)
    return await service.list(
        db,
        filters=filters,
        search=search,
        search_fields=['title', 'message'],
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get('/{item_id}', response_model=NotificationResponse, summary='Get Notification by id')
async def get_notification(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    item = await service.get(db, item_id)
    authz.ensure_can_read_notification(current_user, item)
    return item


@router.post('/', response_model=NotificationResponse, summary='Create Notification', status_code=201)
async def create_notification(
    payload: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)


@router.patch('/{item_id}', response_model=NotificationResponse, summary='Update Notification')
async def update_notification(
    item_id: UUID,
    payload: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    payload_data = payload.model_dump(exclude_unset=True)
    item = await service.get(db, item_id)
    authz.ensure_can_update_notification(current_user, item)
    return await service.update(db, item_id, payload_data)


@router.delete('/{item_id}', status_code=204, summary='Delete Notification')
async def delete_notification(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    await service.delete(db, item_id)
    return Response(status_code=204)
