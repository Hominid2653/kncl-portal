from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.club_member import ClubMember
from app.repositories.base_repository import BaseRepository


class ClubMemberRepository(BaseRepository[ClubMember]):
    def __init__(self):
        super().__init__(ClubMember)

    async def get_by_membership(self, db: AsyncSession, club_id: str, user_profile_id: str):
        result = await db.execute(
            select(ClubMember).where(
                ClubMember.club_id == club_id,
                ClubMember.user_profile_id == user_profile_id,
            )
        )
        return result.scalar_one_or_none()
