from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.season import Season
from app.repositories.base_repository import BaseRepository


class SeasonRepository(BaseRepository[Season]):
    def __init__(self):
        super().__init__(Season)

    async def get_by_year(self, db: AsyncSession, league_id: str, year: int):
        result = await db.execute(
            select(Season).where(Season.league_id == league_id, Season.year == year)
        )
        return result.scalar_one_or_none()
