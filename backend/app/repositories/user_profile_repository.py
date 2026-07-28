from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_profile import UserProfile
from app.repositories.base_repository import BaseRepository


class UserProfileRepository(BaseRepository[UserProfile]):
    def __init__(self):
        super().__init__(UserProfile)

    async def get_by_auth_user_id(self, db: AsyncSession, auth_user_id: UUID):
        result = await db.execute(
            select(UserProfile).where(UserProfile.auth_user_id == auth_user_id)
        )
        return result.scalar_one_or_none()
