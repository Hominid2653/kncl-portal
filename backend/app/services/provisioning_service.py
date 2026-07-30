from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.enums import UserRole


class ProvisioningService:
    """Creates Supabase auth users and domain profiles on application approval (Phase 3)."""

    async def provision_captain(
        self,
        db: AsyncSession,
        *,
        email: str,
        first_name: str,
        last_name: str,
        phone: str,
        club_name: str,
        league_id: UUID,
    ) -> dict[str, UUID]:
        logger.info(
            "provisioning.stub action=provision_captain email=%s club=%s league_id=%s",
            email,
            club_name,
            league_id,
        )
        raise NotImplementedError("Captain provisioning is implemented in Phase 3.")

    async def provision_player(
        self,
        db: AsyncSession,
        *,
        email: str,
        first_name: str,
        last_name: str,
        county: str,
        nationality: str,
        federation_id: str | None = None,
    ) -> dict[str, UUID]:
        logger.info(
            "provisioning.stub action=provision_player email=%s federation_id=%s",
            email,
            federation_id,
        )
        raise NotImplementedError("Player provisioning is implemented in Phase 3.")

    async def provision_coordinator(
        self,
        db: AsyncSession,
        *,
        email: str,
        first_name: str,
        last_name: str,
        league_ids: list[UUID],
    ) -> UUID:
        logger.info(
            "provisioning.stub action=provision_coordinator email=%s role=%s",
            email,
            UserRole.LEAGUE_COORDINATOR.value,
        )
        raise NotImplementedError("Coordinator provisioning is implemented in Phase 3.")
