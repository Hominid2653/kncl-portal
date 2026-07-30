from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EngagementStatus
from app.models.player_engagement import PlayerEngagement
from app.repositories.base_repository import BaseRepository


class EngagementRepository(BaseRepository[PlayerEngagement]):
    def __init__(self):
        super().__init__(PlayerEngagement)

    async def get_pending_for_club_player(
        self,
        db: AsyncSession,
        *,
        requesting_club_id: UUID,
        player_id: UUID,
    ) -> PlayerEngagement | None:
        result = await db.execute(
            select(PlayerEngagement).where(
                PlayerEngagement.requesting_club_id == requesting_club_id,
                PlayerEngagement.player_id == player_id,
                PlayerEngagement.status == EngagementStatus.PENDING,
            )
        )
        return result.scalar_one_or_none()
