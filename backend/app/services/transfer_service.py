from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResource, ResourceNotFound, ValidationError
from app.dependencies.auth import CurrentUser
from app.lib.business_rules import assert_transfer_window, player_has_approved_registration
from app.models.audit_log import AuditLog
from app.models.enums import ApprovalDecision, RegistrationStatus, TransferSource, TransferStatus
from app.models.notification import Notification
from app.models.registration import Registration
from app.models.transfer import Transfer
from app.models.transfer_approval import TransferApproval
from app.repositories.player_repository import PlayerRepository
from app.repositories.registration_repository import RegistrationRepository
from app.repositories.transfer_repository import TransferRepository
from app.schemas.transfer import TransferAction, TransferCreate, TransferUpdate
from app.services.base_services import BaseService

TERMINAL_STATUSES = {
    TransferStatus.APPROVED,
    TransferStatus.REJECTED,
    TransferStatus.CANCELLED,
}


class TransferService(BaseService[Transfer]):
    def __init__(self):
        super().__init__(TransferRepository())
        self.registration_repository = RegistrationRepository()
        self.player_repository = PlayerRepository()

    async def submit(
        self,
        db: AsyncSession,
        data: TransferCreate,
        actor: CurrentUser,
    ) -> Transfer:
        registration = await self._resolve_registration(db, data)
        await assert_transfer_window(db, season_id=registration.season_id)
        self._validate_submission(registration, data)

        existing_pending = await self.repository.get_pending_for_registration(
            db,
            registration.id,
        )
        if existing_pending:
            raise DuplicateResource(
                "A pending transfer already exists for this registration.",
            )

        now = datetime.now(timezone.utc)
        transfer = Transfer(
            registration_id=registration.id,
            from_club_id=data.from_club_id,
            to_club_id=data.to_club_id,
            reason=data.reason,
            source=data.source,
            player_id=data.player_id or registration.player_id,
            engagement_id=data.engagement_id,
            submitted_by_user_profile_id=actor.id,
            status=TransferStatus.PENDING,
            submitted_at=now,
        )
        db.add(transfer)
        await db.flush()

        player = await self.player_repository.get_by_id(db, registration.player_id)
        if player:
            await self._create_notification(
                db,
                user_profile_id=player.user_profile_id,
                title="Transfer request submitted",
                message=(
                    "Your transfer request has been submitted and is pending league approval."
                ),
            )

        await self._create_audit_log(
            db,
            actor_id=actor.id,
            action="TRANSFER_SUBMITTED",
            entity_id=transfer.id,
        )
        await db.commit()
        await db.refresh(transfer)
        return transfer

    async def approve(
        self,
        db: AsyncSession,
        transfer_id: UUID,
        actor: CurrentUser,
        action: TransferAction | None = None,
    ) -> Transfer:
        transfer = await self.get(db, transfer_id)
        self._ensure_pending(transfer, "approve")

        now = datetime.now(timezone.utc)
        registration = await self._get_registration(db, transfer.registration_id)

        transfer.status = TransferStatus.APPROVED
        transfer.completed_at = now
        registration.club_id = transfer.to_club_id

        db.add(
            TransferApproval(
                transfer_id=transfer.id,
                approved_by=actor.id,
                decision=ApprovalDecision.APPROVED,
                remarks=action.remarks if action else None,
                approved_at=now,
            )
        )

        player = await self.player_repository.get_by_id(db, registration.player_id)
        if player:
            await self._create_notification(
                db,
                user_profile_id=player.user_profile_id,
                title="Transfer approved",
                message="Your transfer request has been approved.",
            )

        await self._create_audit_log(
            db,
            actor_id=actor.id,
            action="TRANSFER_APPROVED",
            entity_id=transfer.id,
        )
        await db.commit()
        await db.refresh(transfer)
        return transfer

    async def reject(
        self,
        db: AsyncSession,
        transfer_id: UUID,
        actor: CurrentUser,
        action: TransferAction | None = None,
    ) -> Transfer:
        transfer = await self._transition_to_terminal(
            db,
            transfer_id=transfer_id,
            actor=actor,
            new_status=TransferStatus.REJECTED,
            decision=ApprovalDecision.REJECTED,
            audit_action="TRANSFER_REJECTED",
            notification_title="Transfer rejected",
            notification_message="Your transfer request has been rejected.",
            remarks=action.remarks if action else None,
        )
        return transfer

    async def cancel(
        self,
        db: AsyncSession,
        transfer_id: UUID,
        actor: CurrentUser,
        action: TransferAction | None = None,
    ) -> Transfer:
        transfer = await self.get(db, transfer_id)
        self._ensure_pending(transfer, "cancel")

        now = datetime.now(timezone.utc)
        transfer.status = TransferStatus.CANCELLED
        transfer.completed_at = now

        registration = await self._get_registration(db, transfer.registration_id)
        player = await self.player_repository.get_by_id(db, registration.player_id)
        if player:
            await self._create_notification(
                db,
                user_profile_id=player.user_profile_id,
                title="Transfer cancelled",
                message="Your transfer request has been cancelled.",
            )

        await self._create_audit_log(
            db,
            actor_id=actor.id,
            action="TRANSFER_CANCELLED",
            entity_id=transfer.id,
            details=action.remarks if action else None,
        )
        await db.commit()
        await db.refresh(transfer)
        return transfer

    async def update_pending_reason(
        self,
        db: AsyncSession,
        transfer_id: UUID,
        data: TransferUpdate,
    ) -> Transfer:
        transfer = await self.get(db, transfer_id)
        if transfer.status in TERMINAL_STATUSES:
            raise ValidationError("Completed transfers cannot be modified.")

        if data.reason is None:
            raise ValidationError("No fields provided to update.")

        transfer.reason = data.reason
        db.add(transfer)
        await db.commit()
        await db.refresh(transfer)
        return transfer

    async def _transition_to_terminal(
        self,
        db: AsyncSession,
        *,
        transfer_id: UUID,
        actor: CurrentUser,
        new_status: TransferStatus,
        decision: ApprovalDecision,
        audit_action: str,
        notification_title: str,
        notification_message: str,
        remarks: str | None,
    ) -> Transfer:
        transfer = await self.get(db, transfer_id)
        self._ensure_pending(transfer, decision.value.lower())

        now = datetime.now(timezone.utc)
        transfer.status = new_status
        transfer.completed_at = now

        db.add(
            TransferApproval(
                transfer_id=transfer.id,
                approved_by=actor.id,
                decision=decision,
                remarks=remarks,
                approved_at=now,
            )
        )

        registration = await self._get_registration(db, transfer.registration_id)
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
            action=audit_action,
            entity_id=transfer.id,
        )
        await db.commit()
        await db.refresh(transfer)
        return transfer

    async def _get_registration(self, db: AsyncSession, registration_id: UUID) -> Registration:
        registration = await self.registration_repository.get_by_id(db, registration_id)
        if not registration:
            raise ResourceNotFound("Registration not found.")
        return registration

    def _validate_submission(
        self,
        registration: Registration,
        data: TransferCreate,
    ) -> None:
        if registration.status is not RegistrationStatus.APPROVED:
            raise ValidationError(
                "Registration must be approved before submitting a transfer.",
            )
        if data.from_club_id != registration.club_id:
            raise ValidationError(
                "from_club_id must match the player's current club on the registration.",
            )
        if data.from_club_id == data.to_club_id:
            raise ValidationError("Destination club must differ from the current club.")

    def _ensure_pending(self, transfer: Transfer, action: str) -> None:
        if transfer.status is not TransferStatus.PENDING:
            raise DuplicateResource(f"Only pending transfers can be {action}.")

    async def _resolve_registration(
        self,
        db: AsyncSession,
        data: TransferCreate,
    ) -> Registration:
        if data.registration_id:
            return await self._get_registration(db, data.registration_id)

        if not data.player_id:
            raise ValidationError("player_id is required when registration_id is omitted.")

        registration = await player_has_approved_registration(db, data.player_id)
        if not registration:
            raise ValidationError("Player must have an approved registration to request a transfer.")
        return registration

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
        details: str | None = None,
    ) -> None:
        db.add(
            AuditLog(
                user_profile_id=actor_id,
                action=action if not details else f"{action}: {details}",
                entity="transfer",
                entity_id=entity_id,
            )
        )
        await db.flush()
