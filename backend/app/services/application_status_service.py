from sqlalchemy.ext.asyncio import AsyncSession

from app.models.club_captain_application import ClubCaptainApplication
from app.models.player_profile_application import PlayerProfileApplication
from app.repositories.application_repository import (
    ClubCaptainApplicationRepository,
    PlayerProfileApplicationRepository,
)
from app.schemas.auth_otp import (
    ApplicationStatusResponse,
    ClubApplicationStatusItem,
    PlayerApplicationStatusItem,
)
from app.services.otp_service import OtpService


class ApplicationStatusService:
    def __init__(self) -> None:
        self.club_repository = ClubCaptainApplicationRepository()
        self.player_repository = PlayerProfileApplicationRepository()
        self.otp_service = OtpService()

    async def get_status_for_email(
        self,
        db: AsyncSession,
        email: str,
    ) -> ApplicationStatusResponse:
        normalized = self.otp_service.normalize_email(email)
        club_application = await self.club_repository.get_latest_by_email(db, normalized)
        player_application = await self.player_repository.get_latest_by_email(db, normalized)

        return ApplicationStatusResponse(
            email=normalized,
            club_application=self._map_club_application(club_application),
            player_application=self._map_player_application(player_application),
        )

    def _map_club_application(
        self,
        application: ClubCaptainApplication | None,
    ) -> ClubApplicationStatusItem | None:
        if not application:
            return None
        return ClubApplicationStatusItem(
            id=str(application.id),
            club_name=application.club_name,
            status=application.status,
            rejection_reason=application.rejection_reason,
            submitted_at=application.created_at,
            reviewed_at=application.reviewed_at,
        )

    def _map_player_application(
        self,
        application: PlayerProfileApplication | None,
    ) -> PlayerApplicationStatusItem | None:
        if not application:
            return None
        return PlayerApplicationStatusItem(
            id=str(application.id),
            first_name=application.first_name,
            last_name=application.last_name,
            status=application.status,
            rejection_reason=application.rejection_reason,
            submitted_at=application.created_at,
            reviewed_at=application.reviewed_at,
        )
