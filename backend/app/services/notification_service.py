from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationCreate
from app.services.base_services import BaseService


class NotificationService(BaseService[Notification]):
    def __init__(self):
        super().__init__(NotificationRepository())

    async def create(self, db, data: NotificationCreate):
        notification = Notification(**data.model_dump())
        return await super().create(db, notification)
