from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import HeadshotSource
from app.models.player import Player
from app.schemas.headshot import HeadshotResponse
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
