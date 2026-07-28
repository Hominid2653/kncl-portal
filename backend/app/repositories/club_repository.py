from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.club import Club
from app.repositories.base_repository import BaseRepository


class ClubRepository(BaseRepository[Club]):
    def __init__(self):
        super().__init__(Club)

    async def get_by_name(self, db: AsyncSession, league_id: str, name: str):
        result = await db.execute(
            select(Club).where(Club.league_id == league_id, Club.name == name)
        )
        return result.scalar_one_or_none()
