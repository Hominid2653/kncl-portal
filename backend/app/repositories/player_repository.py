from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.player import Player
from app.repositories.base_repository import BaseRepository


class PlayerRepository(BaseRepository[Player]):
    def __init__(self):
        super().__init__(Player)

    async def get_by_fide_id(self, db: AsyncSession, fide_id: str):
        result = await db.execute(
            select(Player).where(Player.fide_id == fide_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_profile_id(self, db: AsyncSession, user_profile_id: UUID):
        result = await db.execute(
            select(Player).where(Player.user_profile_id == user_profile_id)
        )
        return result.scalar_one_or_none()
