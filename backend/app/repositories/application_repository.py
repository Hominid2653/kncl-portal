from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.club_captain_application import ClubCaptainApplication
from app.models.enums import ApplicationStatus
from app.models.player_profile_application import PlayerProfileApplication
from app.repositories.base_repository import BaseRepository


class ClubCaptainApplicationRepository(BaseRepository[ClubCaptainApplication]):
    def __init__(self) -> None:
        super().__init__(ClubCaptainApplication)

    async def get_latest_by_email(
        self,
        db: AsyncSession,
        email: str,
    ) -> ClubCaptainApplication | None:
        result = await db.execute(
            select(ClubCaptainApplication)
            .where(ClubCaptainApplication.captain_email == email)
            .order_by(ClubCaptainApplication.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def has_pending_for_email(self, db: AsyncSession, email: str) -> bool:
        result = await db.execute(
            select(ClubCaptainApplication.id).where(
                ClubCaptainApplication.captain_email == email,
                ClubCaptainApplication.status == ApplicationStatus.PENDING,
            )
        )
        return result.scalar_one_or_none() is not None


class PlayerProfileApplicationRepository(BaseRepository[PlayerProfileApplication]):
    def __init__(self) -> None:
        super().__init__(PlayerProfileApplication)

    async def get_latest_by_email(
        self,
        db: AsyncSession,
        email: str,
    ) -> PlayerProfileApplication | None:
        result = await db.execute(
            select(PlayerProfileApplication)
            .where(PlayerProfileApplication.email == email)
            .order_by(PlayerProfileApplication.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def has_pending_for_email(self, db: AsyncSession, email: str) -> bool:
        result = await db.execute(
            select(PlayerProfileApplication.id).where(
                PlayerProfileApplication.email == email,
                PlayerProfileApplication.status == ApplicationStatus.PENDING,
            )
        )
        return result.scalar_one_or_none() is not None
