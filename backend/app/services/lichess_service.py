from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.integrations.lichess_client import LichessClient
from app.models.player import Player
from app.schemas.lichess import LichessRatings, LichessUserResponse
from app.services.player_service import PlayerService


def _rating_from_perfs(perfs: dict, key: str) -> int | None:
    perf = perfs.get(key) or {}
    rating = perf.get("rating")
    return int(rating) if rating is not None else None


class LichessService:
    def __init__(
        self,
        *,
        client: LichessClient | None = None,
        player_service: PlayerService | None = None,
    ) -> None:
        self.client = client or LichessClient()
        self.player_service = player_service or PlayerService()

    def to_response(self, data: dict) -> LichessUserResponse:
        perfs = data.get("perfs") or {}
        profile = data.get("profile") or {}
        username = data["username"]
        return LichessUserResponse(
            username=username,
            title=data.get("title"),
            profile_url=data.get("url") or f"https://lichess.org/@/{username}",
            country=profile.get("country"),
            fide_rating=profile.get("fideRating"),
            ratings=LichessRatings(
                bullet=_rating_from_perfs(perfs, "bullet"),
                blitz=_rating_from_perfs(perfs, "blitz"),
                rapid=_rating_from_perfs(perfs, "rapid"),
                classical=_rating_from_perfs(perfs, "classical"),
            ),
        )

    async def lookup_user(self, username: str) -> LichessUserResponse:
        data = await self.client.get_user(username)
        return self.to_response(data)

    async def lookup_player(self, player: Player) -> LichessUserResponse:
        if not player.lichess_username:
            raise ValidationError("Player does not have a Lichess username.")
        return await self.lookup_user(player.lichess_username)

    async def sync_player_ratings(self, db: AsyncSession, player_id: UUID) -> Player:
        player = await self.player_service.get(db, player_id)
        if not player.lichess_username:
            raise ValidationError("Player does not have a Lichess username.")

        profile = await self.lookup_user(player.lichess_username)
        return await self.player_service.update(
            db,
            player_id,
            {
                "blitz_rating": profile.ratings.blitz,
                "rapid_rating": profile.ratings.rapid,
                "classical_rating": profile.ratings.classical,
            },
        )
