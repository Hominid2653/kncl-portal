"""Application submit/review service — implemented in Phase 3."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.application_repository import (
    ClubCaptainApplicationRepository,
    PlayerProfileApplicationRepository,
)
from app.services.provisioning_service import ProvisioningService


class ApplicationService:
    def __init__(self) -> None:
        self.club_repository = ClubCaptainApplicationRepository()
        self.player_repository = PlayerProfileApplicationRepository()
        self.provisioning_service = ProvisioningService()

    async def submit_club_application(self, db: AsyncSession, **_: object) -> None:
        raise NotImplementedError("Club application submit is implemented in Phase 3.")

    async def submit_player_application(self, db: AsyncSession, **_: object) -> None:
        raise NotImplementedError("Player application submit is implemented in Phase 3.")
