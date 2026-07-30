from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.club import Club
from app.models.enums import HeadshotSource, RegistrationStatus
from app.models.player import Player
from app.models.registration import Registration
from app.models.user_profile import UserProfile
from app.schemas.headshot import HeadshotResponse, PendingHeadshotItem
from app.services.player_service import PlayerService
from app.services.storage_service import StorageService


class HeadshotService:
    def __init__(
        self,
        *,
        storage: StorageService | None = None,
        player_service: PlayerService | None = None,
    ) -> None:
        self.storage = storage or StorageService()
        self.player_service = player_service or PlayerService()

    async def upload_file(
        self,
        db: AsyncSession,
        player_id: UUID,
        *,
        filename: str,
        content_type: str | None,
        content: bytes,
    ) -> Player:
        resolved_type = self.storage.validate_image_upload(
            filename=filename,
            content_type=content_type,
            size_bytes=len(content),
        )
        storage_path = self.storage.build_headshot_path(str(player_id), filename)
        await self.storage.upload(
            storage_path=storage_path,
            content=content,
            content_type=resolved_type,
        )

        existing = await self.player_service.get(db, player_id)
        if (
            existing.headshot_url
            and existing.headshot_source == HeadshotSource.UPLOAD
            and not existing.headshot_url.startswith("http")
        ):
            await self.storage.delete(existing.headshot_url)

        return await self.player_service.update_headshot(
            db,
            player_id,
            headshot_url=storage_path,
            headshot_source=HeadshotSource.UPLOAD,
        )

    async def to_response(self, player: Player) -> HeadshotResponse:
        display_url = await self.storage.resolve_public_url(player.headshot_url)
        return HeadshotResponse(
            player_id=player.id,
            headshot_url=display_url,
            headshot_source=player.headshot_source,
            headshot_moderation_status=player.headshot_moderation_status,
            headshot_updated_at=player.headshot_updated_at,
        )

    async def list_pending(self, db: AsyncSession) -> list[PendingHeadshotItem]:
        result = await db.execute(
            select(Player).where(
                Player.headshot_moderation_status == "PENDING",
                Player.headshot_url.isnot(None),
            )
        )
        players = result.scalars().all()
        items: list[PendingHeadshotItem] = []

        for player in players:
            profile = await db.get(UserProfile, player.user_profile_id)
            player_name = (
                f"{profile.first_name} {profile.last_name}".strip()
                if profile
                else "Player"
            )
            league_id = await self._league_id_for_player(db, player.id)
            display_url = await self.storage.resolve_public_url(player.headshot_url)
            items.append(
                PendingHeadshotItem(
                    player_id=player.id,
                    player_name=player_name,
                    headshot_url=display_url,
                    league_id=league_id,
                    headshot_updated_at=player.headshot_updated_at,
                )
            )

        return items

    async def _league_id_for_player(self, db: AsyncSession, player_id: UUID) -> UUID | None:
        registration_result = await db.execute(
            select(Registration)
            .where(
                Registration.player_id == player_id,
                Registration.status == RegistrationStatus.APPROVED,
            )
            .order_by(Registration.registered_at.desc())
            .limit(1)
        )
        registration = registration_result.scalar_one_or_none()
        if not registration:
            return None

        club = await db.get(Club, registration.club_id)
        return club.league_id if club else None
