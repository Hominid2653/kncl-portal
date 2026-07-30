from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.club import Club
from app.models.club_captain_application import ClubCaptainApplication
from app.models.enums import ApplicationStatus, EngagementStatus, RegistrationStatus, TransferStatus
from app.models.player_engagement import PlayerEngagement
from app.models.player_profile_application import PlayerProfileApplication
from app.models.notification import Notification
from app.models.player import Player
from app.models.registration import Registration
from app.models.season import Season
from app.models.transfer import Transfer


class DashboardRepository:
    async def count_table(self, db: AsyncSession, model) -> int:
        result = await db.execute(select(func.count()).select_from(model))
        return int(result.scalar_one())

    async def count_notifications(
        self,
        db: AsyncSession,
        user_profile_id: UUID,
        *,
        unread_only: bool = False,
    ) -> int:
        query = select(func.count()).select_from(Notification).where(
            Notification.user_profile_id == user_profile_id
        )
        if unread_only:
            query = query.where(Notification.is_read.is_(False))
        result = await db.execute(query)
        return int(result.scalar_one())

    async def transfer_status_counts(
        self,
        db: AsyncSession,
        *,
        club_ids: list[UUID] | None = None,
        transfer_ids: list[UUID] | None = None,
    ) -> list[tuple[str, int]]:
        query = select(Transfer.status, func.count()).group_by(Transfer.status)
        if club_ids is not None:
            query = query.where(
                or_(Transfer.from_club_id.in_(club_ids), Transfer.to_club_id.in_(club_ids))
            )
        if transfer_ids is not None:
            if not transfer_ids:
                return []
            query = query.where(Transfer.id.in_(transfer_ids))
        result = await db.execute(query)
        return [(row[0].value, int(row[1])) for row in result.all()]

    async def pending_by_club(
        self,
        db: AsyncSession,
        *,
        club_ids: list[UUID] | None = None,
    ) -> list[tuple[UUID, str, int, int]]:
        clubs_query = select(Club.id, Club.name)
        if club_ids is not None:
            if not club_ids:
                return []
            clubs_query = clubs_query.where(Club.id.in_(club_ids))
        clubs_result = await db.execute(clubs_query.order_by(Club.name))
        rows: list[tuple[UUID, str, int, int]] = []
        for club_id, club_name in clubs_result.all():
            transfer_count = await self._count_pending_transfers_for_club(db, club_id)
            registration_count = await self._count_pending_registrations_for_club(db, club_id)
            engagement_count = await self._count_pending_engagements_for_club(db, club_id)
            if transfer_count or registration_count or engagement_count or club_ids is not None:
                rows.append((club_id, club_name, transfer_count, registration_count, engagement_count))
        return rows

    async def registrations_by_season(
        self,
        db: AsyncSession,
        *,
        club_ids: list[UUID] | None = None,
    ) -> list[tuple[UUID, str, str, int]]:
        query = (
            select(Season.id, Season.name, Registration.status, func.count())
            .join(Registration, Registration.season_id == Season.id)
            .group_by(Season.id, Season.name, Registration.status)
            .order_by(Season.year.desc(), Season.name, Registration.status)
        )
        if club_ids is not None:
            if not club_ids:
                return []
            query = query.where(Registration.club_id.in_(club_ids))
        result = await db.execute(query)
        return [
            (row[0], row[1], row[2].value, int(row[3]))
            for row in result.all()
        ]

    async def recent_audit_logs(
        self,
        db: AsyncSession,
        *,
        limit: int = 15,
    ) -> list[AuditLog]:
        result = await db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def recent_transfers(
        self,
        db: AsyncSession,
        *,
        club_ids: list[UUID] | None = None,
        transfer_ids: list[UUID] | None = None,
        limit: int = 10,
    ) -> list[Transfer]:
        query = select(Transfer).order_by(Transfer.submitted_at.desc()).limit(limit)
        if club_ids is not None:
            if not club_ids:
                return []
            query = query.where(
                or_(Transfer.from_club_id.in_(club_ids), Transfer.to_club_id.in_(club_ids))
            )
        if transfer_ids is not None:
            if not transfer_ids:
                return []
            query = query.where(Transfer.id.in_(transfer_ids))
        result = await db.execute(query)
        return list(result.scalars().all())

    async def recent_registrations(
        self,
        db: AsyncSession,
        *,
        club_ids: list[UUID] | None = None,
        player_id: UUID | None = None,
        limit: int = 10,
    ) -> list[Registration]:
        query = select(Registration).order_by(Registration.registered_at.desc()).limit(limit)
        if club_ids is not None:
            if not club_ids:
                return []
            query = query.where(Registration.club_id.in_(club_ids))
        if player_id is not None:
            query = query.where(Registration.player_id == player_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def player_registrations(
        self,
        db: AsyncSession,
        player_id: UUID,
    ) -> list[Registration]:
        result = await db.execute(
            select(Registration)
            .where(Registration.player_id == player_id)
            .order_by(Registration.registered_at.desc())
        )
        return list(result.scalars().all())

    async def player_transfers(
        self,
        db: AsyncSession,
        registration_ids: list[UUID],
    ) -> list[Transfer]:
        if not registration_ids:
            return []
        result = await db.execute(
            select(Transfer)
            .where(Transfer.registration_id.in_(registration_ids))
            .order_by(Transfer.submitted_at.desc())
        )
        return list(result.scalars().all())

    async def get_transfer_ids_for_scope(
        self,
        db: AsyncSession,
        *,
        club_ids: list[UUID] | None = None,
        registration_ids: list[UUID] | None = None,
    ) -> list[UUID]:
        query = select(Transfer.id)
        if club_ids is not None:
            if not club_ids:
                return []
            query = query.where(
                or_(Transfer.from_club_id.in_(club_ids), Transfer.to_club_id.in_(club_ids))
            )
        if registration_ids is not None:
            if not registration_ids:
                return []
            query = query.where(Transfer.registration_id.in_(registration_ids))
        result = await db.execute(query)
        return list(result.scalars().all())

    async def _count_pending_transfers_for_club(self, db: AsyncSession, club_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(Transfer)
            .where(
                Transfer.status == TransferStatus.PENDING,
                or_(Transfer.from_club_id == club_id, Transfer.to_club_id == club_id),
            )
        )
        return int(result.scalar_one())

    async def count_pending_club_applications(self, db: AsyncSession) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(ClubCaptainApplication)
            .where(ClubCaptainApplication.status == ApplicationStatus.PENDING)
        )
        return int(result.scalar_one())

    async def count_pending_player_applications(self, db: AsyncSession) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(PlayerProfileApplication)
            .where(PlayerProfileApplication.status == ApplicationStatus.PENDING)
        )
        return int(result.scalar_one())

    async def count_pending_engagements(self, db: AsyncSession, *, club_ids: list[UUID] | None = None) -> int:
        query = select(func.count()).select_from(PlayerEngagement).where(
            PlayerEngagement.status == EngagementStatus.PENDING
        )
        if club_ids is not None:
            if not club_ids:
                return 0
            query = query.where(
                or_(
                    PlayerEngagement.requesting_club_id.in_(club_ids),
                    PlayerEngagement.recipient_club_id.in_(club_ids),
                )
            )
        result = await db.execute(query)
        return int(result.scalar_one())

    async def _count_pending_engagements_for_club(self, db: AsyncSession, club_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(PlayerEngagement)
            .where(
                PlayerEngagement.status == EngagementStatus.PENDING,
                or_(
                    PlayerEngagement.requesting_club_id == club_id,
                    PlayerEngagement.recipient_club_id == club_id,
                ),
            )
        )
        return int(result.scalar_one())

    async def _count_pending_registrations_for_club(self, db: AsyncSession, club_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(Registration)
            .where(
                Registration.club_id == club_id,
                Registration.status == RegistrationStatus.PENDING,
            )
        )
        return int(result.scalar_one())

    async def count_registrations(
        self,
        db: AsyncSession,
        *,
        club_ids: list[UUID] | None = None,
    ) -> int:
        query = select(func.count()).select_from(Registration)
        if club_ids is not None:
            if not club_ids:
                return 0
            query = query.where(Registration.club_id.in_(club_ids))
        result = await db.execute(query)
        return int(result.scalar_one())

    async def count_transfers(
        self,
        db: AsyncSession,
        *,
        club_ids: list[UUID] | None = None,
        transfer_ids: list[UUID] | None = None,
    ) -> int:
        query = select(func.count()).select_from(Transfer)
        if club_ids is not None:
            if not club_ids:
                return 0
            query = query.where(
                or_(Transfer.from_club_id.in_(club_ids), Transfer.to_club_id.in_(club_ids))
            )
        if transfer_ids is not None:
            if not transfer_ids:
                return 0
            query = query.where(Transfer.id.in_(transfer_ids))
        result = await db.execute(query)
        return int(result.scalar_one())

    async def count_clubs(self, db: AsyncSession, club_ids: list[UUID] | None = None) -> int:
        query = select(func.count()).select_from(Club)
        if club_ids is not None:
            if not club_ids:
                return 0
            query = query.where(Club.id.in_(club_ids))
        result = await db.execute(query)
        return int(result.scalar_one())

    async def count_players(self, db: AsyncSession) -> int:
        result = await db.execute(select(func.count()).select_from(Player))
        return int(result.scalar_one())
