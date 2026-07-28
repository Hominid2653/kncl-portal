from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser
from app.models.audit_log import AuditLog
from app.models.enums import UserRole
from app.models.registration import Registration
from app.models.transfer import Transfer
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
    ActivityItem,
    AdminDashboardResponse,
    ClubDashboardClubSummary,
    ClubDashboardResponse,
    DashboardTotals,
    PlayerDashboardResponse,
    PlayerRegistrationSummary,
    PlayerTransferSummary,
    SeasonRegistrationSummary,
    StatusCount,
    ClubPendingSummary,
)
from app.services.authorization_service import AuthorizationService


class DashboardService:
    def __init__(self) -> None:
        self.repository = DashboardRepository()
        self.authz = AuthorizationService()

    async def get_admin_dashboard(
        self,
        db: AsyncSession,
        user: CurrentUser,
    ) -> AdminDashboardResponse:
        transfer_counts = self._status_counts(
            await self.repository.transfer_status_counts(db)
        )
        pending_rows = await self.repository.pending_by_club(db)
        season_rows = await self.repository.registrations_by_season(db)
        audit_logs = await self.repository.recent_audit_logs(db)

        return AdminDashboardResponse(
            totals=DashboardTotals(
                clubs=await self.repository.count_clubs(db),
                players=await self.repository.count_players(db),
                registrations=await self.repository.count_registrations(db),
                transfers=await self.repository.count_transfers(db),
                unread_notifications=await self.repository.count_notifications(
                    db,
                    user.id,
                    unread_only=True,
                ),
            ),
            transfer_counts=transfer_counts,
            pending_by_club=[
                ClubPendingSummary(
                    club_id=club_id,
                    club_name=club_name,
                    pending_transfers=pending_transfers,
                    pending_registrations=pending_registrations,
                )
                for club_id, club_name, pending_transfers, pending_registrations in pending_rows
                if pending_transfers or pending_registrations
            ],
            registrations_by_season=self._group_season_registrations(season_rows),
            recent_activity=self._audit_activity(audit_logs),
        )

    async def get_club_dashboard(
        self,
        db: AsyncSession,
        user: CurrentUser,
    ) -> ClubDashboardResponse:
        club_ids = await self._club_scope(db, user)
        club_rows = await self.repository.pending_by_club(db, club_ids=club_ids)
        clubs: list[ClubDashboardClubSummary] = []
        for club_id, club_name, pending_transfers, pending_registrations in club_rows:
            transfer_counts = self._status_counts(
                await self.repository.transfer_status_counts(db, club_ids=[club_id])
            )
            clubs.append(
                ClubDashboardClubSummary(
                    club_id=club_id,
                    club_name=club_name,
                    pending_transfers=pending_transfers,
                    pending_registrations=pending_registrations,
                    transfer_counts=transfer_counts,
                )
            )

        recent_transfers = await self.repository.recent_transfers(db, club_ids=club_ids)
        recent_registrations = await self.repository.recent_registrations(
            db,
            club_ids=club_ids,
        )
        activity = self._transfer_activity(recent_transfers) + self._registration_activity(
            recent_registrations
        )
        activity.sort(key=lambda item: item.occurred_at, reverse=True)

        return ClubDashboardResponse(
            clubs=clubs,
            unread_notifications=await self.repository.count_notifications(
                db,
                user.id,
                unread_only=True,
            ),
            recent_activity=activity[:15],
        )

    async def get_player_dashboard(
        self,
        db: AsyncSession,
        user: CurrentUser,
    ) -> PlayerDashboardResponse:
        player = await self.authz.get_player_for_user(db, user)
        if not player:
            return PlayerDashboardResponse(
                registrations=[],
                transfers=[],
                transfer_counts=[],
                unread_notifications=await self.repository.count_notifications(
                    db,
                    user.id,
                    unread_only=True,
                ),
                recent_activity=[],
            )

        registrations = await self.repository.player_registrations(db, player.id)
        registration_ids = [item.id for item in registrations]
        transfers = await self.repository.player_transfers(db, registration_ids)
        transfer_ids = [item.id for item in transfers]

        recent_registrations = registrations[:10]
        recent_transfers = transfers[:10]
        activity = self._transfer_activity(recent_transfers) + self._registration_activity(
            recent_registrations
        )
        activity.sort(key=lambda item: item.occurred_at, reverse=True)

        return PlayerDashboardResponse(
            registrations=[
                PlayerRegistrationSummary(
                    registration_id=item.id,
                    season_id=item.season_id,
                    club_id=item.club_id,
                    status=item.status.value,
                    registered_at=item.registered_at,
                )
                for item in registrations
            ],
            transfers=[
                PlayerTransferSummary(
                    transfer_id=item.id,
                    status=item.status.value,
                    from_club_id=item.from_club_id,
                    to_club_id=item.to_club_id,
                    submitted_at=item.submitted_at,
                )
                for item in transfers
            ],
            transfer_counts=self._status_counts(
                await self.repository.transfer_status_counts(
                    db,
                    transfer_ids=transfer_ids,
                )
            ),
            unread_notifications=await self.repository.count_notifications(
                db,
                user.id,
                unread_only=True,
            ),
            recent_activity=activity[:15],
        )

    async def _club_scope(self, db: AsyncSession, user: CurrentUser) -> list[UUID] | None:
        if self.authz.is_league_leadership(user):
            return None
        return await self.authz.get_club_ids_for_user(db, user)

    def _status_counts(self, rows: list[tuple[str, int]]) -> list[StatusCount]:
        return [StatusCount(status=status, count=count) for status, count in rows]

    def _group_season_registrations(
        self,
        rows: list[tuple[UUID, str, str, int]],
    ) -> list[SeasonRegistrationSummary]:
        grouped: dict[UUID, SeasonRegistrationSummary] = {}
        for season_id, season_name, status, count in rows:
            if season_id not in grouped:
                grouped[season_id] = SeasonRegistrationSummary(
                    season_id=season_id,
                    season_name=season_name,
                    total=0,
                    by_status=[],
                )
            summary = grouped[season_id]
            summary.total += count
            summary.by_status.append(StatusCount(status=status, count=count))
        return list(grouped.values())

    def _audit_activity(self, logs: list[AuditLog]) -> list[ActivityItem]:
        return [
            ActivityItem(
                id=log.id,
                activity_type="audit_log",
                action=log.action,
                summary=f"{log.action} on {log.entity}",
                occurred_at=log.created_at,
                entity_id=log.entity_id,
            )
            for log in logs
        ]

    def _transfer_activity(self, transfers: list[Transfer]) -> list[ActivityItem]:
        return [
            ActivityItem(
                id=transfer.id,
                activity_type="transfer",
                action=transfer.status.value,
                summary=f"Transfer {transfer.status.value.lower()}",
                occurred_at=transfer.submitted_at,
                entity_id=transfer.id,
            )
            for transfer in transfers
        ]

    def _registration_activity(self, registrations: list[Registration]) -> list[ActivityItem]:
        return [
            ActivityItem(
                id=registration.id,
                activity_type="registration",
                action=registration.status.value,
                summary=f"Registration {registration.status.value.lower()}",
                occurred_at=registration.registered_at,
                entity_id=registration.id,
            )
            for registration in registrations
        ]
