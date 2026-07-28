from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.league import League
from app.repositories.base_repository import BaseRepository


class LeagueRepository(BaseRepository[League]):
    def __init__(self):
        super().__init__(League)

    async def get_by_name(
        self,
        db: AsyncSession,
        name: str,
    ):
        result = await db.execute(
            select(League).where(League.name == name)
        )
        return result.scalar_one_or_none()