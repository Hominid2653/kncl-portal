from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.base_repository import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self):
        super().__init__(Notification)

    async def get_by_user(self, db: AsyncSession, user_profile_id: str):
        result = await db.execute(
            select(Notification).where(Notification.user_profile_id == user_profile_id)
        )
        return result.scalars().all()
