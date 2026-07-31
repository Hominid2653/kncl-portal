from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.models.player import Player
from app.services.chesscom_service import ChessComService
from app.services.fide_service import FideService
from app.services.lichess_service import LichessService
from app.services.player_service import PlayerService


class RatingSyncService:
    """Sync ratings using FIDE first, then Lichess, then Chess.com."""

    def __init__(
        self,
        *,
        player_service: PlayerService | None = None,
        fide_service: FideService | None = None,
        lichess_service: LichessService | None = None,
        chesscom_service: ChessComService | None = None,
    ) -> None:
        self.player_service = player_service or PlayerService()
        self.fide_service = fide_service or FideService(player_service=self.player_service)
        self.lichess_service = lichess_service or LichessService(player_service=self.player_service)
        self.chesscom_service = chesscom_service or ChessComService(player_service=self.player_service)

    async def sync_best_available(self, db: AsyncSession, player_id: UUID) -> tuple[Player, str]:
        player = await self.player_service.get(db, player_id)

        if player.fide_id:
            updated = await self.fide_service.sync_player_ratings(db, player_id)
            return updated, "fide"

        if player.lichess_username:
            updated = await self.lichess_service.sync_player_ratings(db, player_id)
            return updated, "lichess"

        if player.chesscom_username:
            updated = await self.chesscom_service.sync_player_ratings(db, player_id)
            return updated, "chesscom"

        raise ValidationError(
            "Link a FIDE ID, Lichess username, or Chess.com username before syncing ratings.",
        )
