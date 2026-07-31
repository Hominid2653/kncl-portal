from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.integrations.fide_client import FideClient
from app.models.player import Player
from app.schemas.external_accounts import ExternalAccountProfile, ExternalRatings
from app.services.player_service import PlayerService


class FideService:
    def __init__(
        self,
        *,
        client: FideClient | None = None,
        player_service: PlayerService | None = None,
    ) -> None:
        self.client = client or FideClient()
        self.player_service = player_service or PlayerService()

    def to_profile(self, data: dict) -> ExternalAccountProfile:
        fide_id = data["fide_id"]
        return ExternalAccountProfile(
            username=fide_id,
            external_user_id=fide_id,
            title=data.get("title"),
            display_name=data.get("name"),
            profile_url=data.get("profile_url") or f"https://ratings.fide.com/profile/{fide_id}",
            fide_rating=data.get("classical_rating"),
            ratings=ExternalRatings(
                classical=data.get("classical_rating"),
                rapid=data.get("rapid_rating"),
                blitz=data.get("blitz_rating"),
            ),
            rating_details={},
        )

    async def lookup_player(self, fide_id: str) -> ExternalAccountProfile:
        data = await self.client.get_player(fide_id)
        return self.to_profile(data)

    async def sync_player_ratings(self, db: AsyncSession, player_id: UUID) -> Player:
        player = await self.player_service.get(db, player_id)
        if not player.fide_id:
            raise ValidationError("Player does not have a FIDE ID.")

        profile = await self.lookup_player(player.fide_id)
        return await self.player_service.update(
            db,
            player_id,
            {
                "classical_rating": profile.ratings.classical,
                "rapid_rating": profile.ratings.rapid,
                "blitz_rating": profile.ratings.blitz,
            },
            skip_external_validation=True,
        )
