from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.integrations.chesscom_client import ChessComClient
from app.models.player import Player
from app.repositories.user_profile_repository import UserProfileRepository
from app.schemas.external_accounts import (
    ExternalAccountProfile,
    PlayerExternalAccountComparison,
    VerificationCodeResponse,
    VerificationResult,
)
from app.services.external_account_helpers import (
    build_player_comparison,
    chesscom_to_profile,
    generate_verification_code,
    names_match,
    utc_now,
)
from app.services.player_service import PlayerService


class ChessComService:
    def __init__(
        self,
        *,
        client: ChessComClient | None = None,
        player_service: PlayerService | None = None,
    ) -> None:
        self.client = client or ChessComClient()
        self.player_service = player_service or PlayerService()

    async def lookup_user(
        self,
        username: str,
        *,
        player: Player | None = None,
    ) -> ExternalAccountProfile:
        player_data = await self.client.get_player(username)
        stats = await self.client.get_stats(username)
        return chesscom_to_profile(
            player_data,
            stats,
            player=player,
            stored_username=player.chesscom_username if player else username,
        )

    async def lookup_player(self, player: Player) -> ExternalAccountProfile:
        if not player.chesscom_username:
            raise ValidationError("Player does not have a Chess.com username.")
        return await self.lookup_user(player.chesscom_username, player=player)

    async def compare_player(self, player: Player) -> PlayerExternalAccountComparison:
        live = await self.lookup_player(player)
        return build_player_comparison(player=player, platform="chesscom", live=live)

    async def sync_player_ratings(self, db: AsyncSession, player_id: UUID) -> Player:
        player = await self.player_service.get(db, player_id)
        if not player.chesscom_username:
            raise ValidationError("Player does not have a Chess.com username.")

        profile = await self.lookup_user(player.chesscom_username, player=player)
        return await self.player_service.update(
            db,
            player_id,
            {
                "blitz_rating": profile.ratings.blitz,
                "rapid_rating": profile.ratings.rapid,
                "classical_rating": profile.ratings.classical,
            },
            skip_external_validation=True,
        )

    async def request_verification(self, db: AsyncSession, player: Player) -> VerificationCodeResponse:
        if not player.chesscom_username:
            raise ValidationError("Player does not have a Chess.com username.")

        code = player.chesscom_verification_code or generate_verification_code()
        if code != player.chesscom_verification_code:
            await self.player_service.update(
                db,
                player.id,
                {"chesscom_verification_code": code},
                skip_external_validation=True,
            )

        return VerificationCodeResponse(
            player_id=player.id,
            platform="chesscom",
            username=player.chesscom_username,
            verification_code=code,
            instructions=(
                "Chess.com does not expose profile bios publicly. Share this code with your "
                "club admin for manual verification, or call POST /players/{id}/chesscom/verify "
                "after your Chess.com display name matches your KNCL profile name."
            ),
        )

    async def confirm_verification(self, db: AsyncSession, player: Player) -> VerificationResult:
        if not player.chesscom_username:
            raise ValidationError("Player does not have a Chess.com username.")
        if player.chesscom_verified and player.chesscom_verified_at:
            return VerificationResult(
                player_id=player.id,
                platform="chesscom",
                username=player.chesscom_username,
                verified=True,
                verified_at=player.chesscom_verified_at,
                method="display_name_match",
            )

        profile = await self.lookup_user(player.chesscom_username, player=player)
        user_profile = await UserProfileRepository().get_by_id(db, player.user_profile_id)
        if not user_profile:
            raise ValidationError("Linked user profile was not found.")

        if not names_match(profile.display_name, user_profile.first_name, user_profile.last_name):
            raise ValidationError(
                "Chess.com display name does not match the KNCL profile name. "
                "Ask a club admin to verify manually."
            )

        verified_at = utc_now()
        await self.player_service.update(
            db,
            player.id,
            {
                "chesscom_verified": True,
                "chesscom_verified_at": verified_at,
                "chesscom_verification_code": None,
            },
            skip_external_validation=True,
        )
        return VerificationResult(
            player_id=player.id,
            platform="chesscom",
            username=player.chesscom_username,
            verified=True,
            verified_at=verified_at,
            method="display_name_match",
        )

    async def admin_verify(self, db: AsyncSession, player: Player) -> VerificationResult:
        if not player.chesscom_username:
            raise ValidationError("Player does not have a Chess.com username.")

        await self.lookup_user(player.chesscom_username, player=player)
        verified_at = utc_now()
        await self.player_service.update(
            db,
            player.id,
            {
                "chesscom_verified": True,
                "chesscom_verified_at": verified_at,
                "chesscom_verification_code": None,
            },
            skip_external_validation=True,
        )
        return VerificationResult(
            player_id=player.id,
            platform="chesscom",
            username=player.chesscom_username,
            verified=True,
            verified_at=verified_at,
            method="admin_attestation",
        )
