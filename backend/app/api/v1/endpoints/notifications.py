from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.notification import (
    NotificationCreate,
    NotificationListResponse,
    NotificationResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix='/notifications', tags=['Notifications'])
service = NotificationService()


@router.get('/', response_model=NotificationListResponse, summary='List notifications')
async def list_notifications(db: AsyncSession = Depends(get_db)):
    notifications = await service.list(db)
    return {'items': notifications, 'total': len(notifications)}


@router.post('/', response_model=NotificationResponse, summary='Create notification', status_code=201)
async def create_notification(
    payload: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
