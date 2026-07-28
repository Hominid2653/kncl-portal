from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResource, ResourceNotFound, ValidationError
from app.dependencies.auth import CurrentUser
from app.models.audit_log import AuditLog
from app.models.enums import RegistrationStatus
from app.models.notification import Notification
from app.models.registration import Registration
from app.repositories.player_repository import PlayerRepository
from app.repositories.registration_repository import RegistrationRepository
from app.repositories.season_repository import SeasonRepository
from app.schemas.registration import RegistrationAction, RegistrationCreate
from app.services.base_services import BaseService

TERMINAL_STATUSES = {
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
}


class RegistrationService(BaseService[Registration]):
    def __init__(self):
        super().__init__(RegistrationRepository())
        self.player_repository = PlayerRepository()
        self.season_repository = SeasonRepository()

    async def submit(
        self,
        db: AsyncSession,
        data: RegistrationCreate,
        actor: CurrentUser,
    ) -> Registration:
        await self._validate_submission(db, data)

        existing = await self.repository.get_by_player_season(
            db,
            data.player_id,
            data.season_id,
        )
        if existing:
            raise DuplicateResource("Player is already registered for this season.")

        now = datetime.now(timezone.utc)
        registration = Registration(
            player_id=data.player_id,
            club_id=data.club_id,
            season_id=data.season_id,
            status=RegistrationStatus.PENDING,
            registered_at=now,
        )
        db.add(registration)
        await db.flush()

        player = await self.player_repository.get_by_id(db, data.player_id)
        if player:
            await self._create_notification(
                db,
                user_profile_id=player.user_profile_id,
                title="Registration submitted",
                message="Your season registration has been submitted and is pending approval.",
            )

        await self._create_audit_log(
            db,
            actor_id=actor.id,
            action="REGISTRATION_SUBMITTED",
            entity_id=registration.id,
        )
        await db.commit()
        await db.refresh(registration)
        return registration

    async def approve(
        self,
        db: AsyncSession,
        registration_id: UUID,
        actor: CurrentUser,
        action: RegistrationAction | None = None,
    ) -> Registration:
        return await self._transition_from_pending(
            db,
            registration_id=registration_id,
            actor=actor,
            new_status=RegistrationStatus.APPROVED,
            audit_action="REGISTRATION_APPROVED",
            notification_title="Registration approved",
            notification_message="Your season registration has been approved.",
            remarks=action.remarks if action else None,
        )

    async def reject(
        self,
        db: AsyncSession,
        registration_id: UUID,
        actor: CurrentUser,
        action: RegistrationAction | None = None,
    ) -> Registration:
        return await self._transition_from_pending(
            db,
            registration_id=registration_id,
            actor=actor,
            new_status=RegistrationStatus.REJECTED,
            audit_action="REGISTRATION_REJECTED",
            notification_title="Registration rejected",
            notification_message="Your season registration has been rejected.",
            remarks=action.remarks if action else None,
        )

    async def _transition_from_pending(
        self,
        db: AsyncSession,
        *,
        registration_id: UUID,
        actor: CurrentUser,
        new_status: RegistrationStatus,
        audit_action: str,
        notification_title: str,
        notification_message: str,
        remarks: str | None,
    ) -> Registration:
        registration = await self.get(db, registration_id)
        self._ensure_pending(registration, new_status.value.lower())

        registration.status = new_status
        db.add(registration)

        player = await self.player_repository.get_by_id(db, registration.player_id)
        if player:
            await self._create_notification(
                db,
                user_profile_id=player.user_profile_id,
                title=notification_title,
                message=notification_message,
            )

        await self._create_audit_log(
            db,
            actor_id=actor.id,
            action=audit_action if not remarks else f"{audit_action}: {remarks}",
            entity_id=registration.id,
        )
        await db.commit()
        await db.refresh(registration)
        return registration

    async def _validate_submission(
        self,
        db: AsyncSession,
        data: RegistrationCreate,
    ) -> None:
        player = await self.player_repository.get_by_id(db, data.player_id)
        if not player:
            raise ResourceNotFound("Player not found.")

        season = await self.season_repository.get_by_id(db, data.season_id)
        if not season:
            raise ResourceNotFound("Season not found.")
        if not season.registration_open:
            raise ValidationError("Registration is closed for this season.")

    def _ensure_pending(self, registration: Registration, action: str) -> None:
        if registration.status is not RegistrationStatus.PENDING:
            raise ValidationError(f"Only pending registrations can be {action}.")

    async def _create_notification(
        self,
        db: AsyncSession,
        *,
        user_profile_id: UUID,
        title: str,
        message: str,
    ) -> None:
        db.add(
            Notification(
                user_profile_id=user_profile_id,
                title=title,
                message=message,
                is_read=False,
            )
        )
        await db.flush()

    async def _create_audit_log(
        self,
        db: AsyncSession,
        *,
        actor_id: UUID,
        action: str,
        entity_id: UUID,
    ) -> None:
        db.add(
            AuditLog(
                user_profile_id=actor_id,
                action=action,
                entity="registration",
                entity_id=entity_id,
            )
        )
        await db.flush()
