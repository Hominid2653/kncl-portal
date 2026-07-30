from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Forbidden
from app.dependencies.auth import CurrentUser
from app.models.audit_log import AuditLog
from app.models.season import Season
from app.repositories.season_repository import SeasonRepository
from app.schemas.season import SeasonCreate
from app.services.base_services import BaseService
from app.services.authorization_service import AuthorizationService


class SeasonService(BaseService[Season]):
    def __init__(self):
        super().__init__(SeasonRepository())
        self.authz = AuthorizationService()

    async def create(self, db, data: SeasonCreate):
        from app.core.exceptions import DuplicateResource

        existing = await self.repository.get_by_year(db, data.league_id, data.year)
        if existing:
            raise DuplicateResource("Season already exists for this league and year.")

        season = Season(**data.model_dump())
        return await super().create(db, season)

    async def update_season(
        self,
        db: AsyncSession,
        season_id: UUID,
        payload_data: dict,
        actor: CurrentUser,
    ) -> Season:
        season = await self.get(db, season_id)
        await self.authz.ensure_can_manage_season(db, actor, season)

        audit_actions: list[str] = []
        if "transfers_open" in payload_data and payload_data["transfers_open"] != season.transfers_open:
            state = "opened" if payload_data["transfers_open"] else "closed"
            audit_actions.append(f"TRANSFER_WINDOW_{state.upper()}")
        if (
            "roster_enrollment_open" in payload_data
            and payload_data["roster_enrollment_open"] != season.roster_enrollment_open
        ):
            state = "opened" if payload_data["roster_enrollment_open"] else "closed"
            audit_actions.append(f"ROSTER_ENROLLMENT_WINDOW_{state.upper()}")

        updated = await self.update(db, season_id, payload_data)

        for action in audit_actions:
            db.add(
                AuditLog(
                    user_profile_id=actor.id,
                    action=action,
                    entity="season",
                    entity_id=season_id,
                )
            )
        if audit_actions:
            await db.commit()
            await db.refresh(updated)
        return updated
