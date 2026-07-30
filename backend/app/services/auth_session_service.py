from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser
from app.models.club import Club
from app.models.club_member import ClubMember
from app.models.user_profile import UserProfile
from app.repositories.player_repository import PlayerRepository
from app.repositories.user_profile_repository import UserProfileRepository
from app.schemas.auth_session import AuthSessionResponse


class AuthSessionService:
    def __init__(self) -> None:
        self.user_profile_repository = UserProfileRepository()
        self.player_repository = PlayerRepository()

    async def get_session(self, db: AsyncSession, user: CurrentUser) -> AuthSessionResponse:
        profile = await self.user_profile_repository.get_by_id(db, user.id)
        if not profile:
            return AuthSessionResponse(
                id=user.id,
                email=user.email,
                first_name=user.email.split("@", maxsplit=1)[0],
                last_name="",
                role=user.role,
            )

        club_id, club_name = await self._club_for_profile(db, profile)
        player_id = await self._player_id_for_profile(db, profile.id)
        league_ids = list(profile.coordinator_league_ids or [])

        return AuthSessionResponse(
            id=profile.id,
            email=user.email,
            first_name=profile.first_name,
            last_name=profile.last_name,
            role=profile.role,
            club_id=club_id,
            club_name=club_name,
            player_id=player_id,
            league_ids=league_ids,
        )

    async def _club_for_profile(
        self,
        db: AsyncSession,
        profile: UserProfile,
    ) -> tuple[UUID | None, str | None]:
        result = await db.execute(
            select(ClubMember.club_id).where(ClubMember.user_profile_id == profile.id).limit(1)
        )
        club_id = result.scalar_one_or_none()
        if not club_id:
            return None, None

        club_result = await db.execute(select(Club.name).where(Club.id == club_id))
        club_name = club_result.scalar_one_or_none()
        return club_id, club_name

    async def _player_id_for_profile(self, db: AsyncSession, profile_id: UUID) -> UUID | None:
        player = await self.player_repository.get_by_user_profile_id(db, profile_id)
        return player.id if player else None
