from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.integrations.lichess_client import LichessClient
from app.models.player import Player
from app.schemas.external_accounts import (
    ExternalAccountProfile,
    PlayerExternalAccountComparison,
    VerificationCodeResponse,
    VerificationResult,
)
from app.services.external_account_helpers import (
    build_player_comparison,
    generate_verification_code,
    lichess_to_profile,
    utc_now,
)
from app.services.player_service import PlayerService


class LichessService:
    def __init__(
        self,
        *,
        client: LichessClient | None = None,
        player_service: PlayerService | None = None,
    ) -> None:
        self.client = client or LichessClient()
        self.player_service = player_service or PlayerService()

    def to_profile(
        self,
        data: dict,
        *,
        player: Player | None = None,
        stored_username: str | None = None,
    ) -> ExternalAccountProfile:
        return lichess_to_profile(data, player=player, stored_username=stored_username)

    async def lookup_user(
        self,
        username: str,
        *,
        player: Player | None = None,
    ) -> ExternalAccountProfile:
        data = await self.client.get_user(username)
        return self.to_profile(
            data,
            player=player,
            stored_username=player.lichess_username if player else username,
        )

    async def lookup_player(self, player: Player) -> ExternalAccountProfile:
        if not player.lichess_username:
            raise ValidationError("Player does not have a Lichess username.")
        return await self.lookup_user(player.lichess_username, player=player)

    async def compare_player(self, player: Player) -> PlayerExternalAccountComparison:
        live = await self.lookup_player(player)
        return build_player_comparison(player=player, platform="lichess", live=live)

    async def sync_player_ratings(self, db: AsyncSession, player_id: UUID) -> Player:
        player = await self.player_service.get(db, player_id)
        if not player.lichess_username:
            raise ValidationError("Player does not have a Lichess username.")

        profile = await self.lookup_user(player.lichess_username, player=player)
        return await self.player_service.update(
            db,
            player_id,
            {
                "blitz_rating": profile.ratings.blitz,
                "rapid_rating": profile.ratings.rapid,
                "classical_rating": profile.ratings.classical,
                "lichess_user_id": profile.external_user_id,
            },
            skip_external_validation=True,
        )

    async def request_verification(self, db: AsyncSession, player: Player) -> VerificationCodeResponse:
        if not player.lichess_username:
            raise ValidationError("Player does not have a Lichess username.")

        code = player.lichess_verification_code or generate_verification_code()
        if code != player.lichess_verification_code:
            await self.player_service.update(
                db,
                player.id,
                {"lichess_verification_code": code},
                skip_external_validation=True,
            )

        return VerificationCodeResponse(
            player_id=player.id,
            platform="lichess",
            username=player.lichess_username,
            verification_code=code,
            instructions=(
                "Add this code to your Lichess profile bio, save the profile, "
                "then call POST /players/{id}/lichess/verify to confirm."
            ),
        )

    async def confirm_verification(self, db: AsyncSession, player: Player) -> VerificationResult:
        if not player.lichess_username:
            raise ValidationError("Player does not have a Lichess username.")
        if player.lichess_verified and player.lichess_verified_at:
            return VerificationResult(
                player_id=player.id,
                platform="lichess",
                username=player.lichess_username,
                verified=True,
                verified_at=player.lichess_verified_at,
                method="bio_code",
            )
        if not player.lichess_verification_code:
            raise ValidationError("Request a verification code before confirming.")

        data = await self.client.get_user(player.lichess_username, skip_cache=True)
        bio = (data.get("profile") or {}).get("bio") or ""
        if player.lichess_verification_code.upper() not in bio.upper():
            raise ValidationError("Verification code was not found in the Lichess profile bio.")

        verified_at = utc_now()
        await self.player_service.update(
            db,
            player.id,
            {
                "lichess_verified": True,
                "lichess_verified_at": verified_at,
                "lichess_user_id": data.get("id"),
                "lichess_verification_code": None,
            },
            skip_external_validation=True,
        )
        return VerificationResult(
            player_id=player.id,
            platform="lichess",
            username=player.lichess_username,
            verified=True,
            verified_at=verified_at,
            method="bio_code",
        )

    async def admin_verify(self, db: AsyncSession, player: Player) -> VerificationResult:
        if not player.lichess_username:
            raise ValidationError("Player does not have a Lichess username.")

        profile = await self.lookup_user(player.lichess_username, player=player)
        verified_at = utc_now()
        await self.player_service.update(
            db,
            player.id,
            {
                "lichess_verified": True,
                "lichess_verified_at": verified_at,
                "lichess_user_id": profile.external_user_id,
                "lichess_verification_code": None,
            },
            skip_external_validation=True,
        )
        return VerificationResult(
            player_id=player.id,
            platform="lichess",
            username=player.lichess_username,
            verified=True,
            verified_at=verified_at,
            method="admin_attestation",
        )
