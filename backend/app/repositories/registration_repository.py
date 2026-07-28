from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.registration import Registration
from app.repositories.base_repository import BaseRepository


class RegistrationRepository(BaseRepository[Registration]):
    def __init__(self):
        super().__init__(Registration)

    async def get_by_player_season(
        self,
        db: AsyncSession,
        player_id: str,
        season_id: str,
    ):
        result = await db.execute(
            select(Registration).where(
                Registration.player_id == player_id,
                Registration.season_id == season_id,
            )
        )
        return result.scalar_one_or_none()
