from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Forbidden
from app.dependencies.auth import CurrentUser
from app.models.club import Club
from app.models.club import Club
from app.models.club_member import ClubMember
from app.models.document import Document
from app.models.enums import UserRole
from app.models.notification import Notification
from app.models.player import Player
from app.models.registration import Registration
from app.models.season import Season
from app.models.transfer import Transfer
from app.models.transfer_approval import TransferApproval
from app.models.user_profile import UserProfile
from app.repositories.player_repository import PlayerRepository


class AuthorizationService:
    """Role-based access checks and list-filter scoping."""

    def is_federation_admin(self, user: CurrentUser) -> bool:
        return user.role is UserRole.FEDERATION_ADMIN

    def is_league_leadership(self, user: CurrentUser) -> bool:
        return user.role in {UserRole.FEDERATION_ADMIN, UserRole.LEAGUE_COORDINATOR}

    def is_club_leadership(self, user: CurrentUser) -> bool:
        return user.role in {
            UserRole.FEDERATION_ADMIN,
            UserRole.LEAGUE_COORDINATOR,
            UserRole.CLUB_ADMIN,
        }

    async def get_club_ids_for_user(self, db: AsyncSession, user: CurrentUser) -> list[UUID]:
        result = await db.execute(
            select(ClubMember.club_id).where(ClubMember.user_profile_id == user.id)
        )
        return list(result.scalars().all())

    async def get_player_for_user(self, db: AsyncSession, user: CurrentUser) -> Player | None:
        return await PlayerRepository().get_by_user_profile_id(db, user.id)

    async def scope_user_profile_filters(
        self,
        db: AsyncSession,
        user: CurrentUser,
        filters: dict,
    ) -> dict:
        if self.is_league_leadership(user):
            return filters
        filters = dict(filters)
        filters["id"] = str(user.id)
        return filters

    async def get_player_ids_for_clubs(self, db: AsyncSession, club_ids: list[UUID]) -> list[UUID]:
        if not club_ids:
            return []
        result = await db.execute(
            select(Registration.player_id)
            .where(Registration.club_id.in_(club_ids))
            .distinct()
        )
        return list(result.scalars().all())

    async def get_registration_ids_for_player(self, db: AsyncSession, player_id: UUID) -> list[UUID]:
        result = await db.execute(
            select(Registration.id).where(Registration.player_id == player_id)
        )
        return list(result.scalars().all())

    async def get_transfer_ids_for_clubs(self, db: AsyncSession, club_ids: list[UUID]) -> list[UUID]:
        if not club_ids:
            return []
        result = await db.execute(
            select(Transfer.id).where(
                or_(Transfer.from_club_id.in_(club_ids), Transfer.to_club_id.in_(club_ids))
            )
        )
        return list(result.scalars().all())

    async def scope_player_filters(
        self,
        db: AsyncSession,
        user: CurrentUser,
        filters: dict,
    ) -> dict:
        if self.is_league_leadership(user):
            return filters

        filters = dict(filters)
        if user.role is UserRole.PLAYER:
            filters["user_profile_id"] = str(user.id)
            return filters

        club_ids = await self.get_club_ids_for_user(db, user)
        player_ids = await self.get_player_ids_for_clubs(db, club_ids)
        filters["id"] = [str(player_id) for player_id in player_ids] or [str(UUID(int=0))]
        return filters

    async def scope_club_member_filters(
        self,
        db: AsyncSession,
        user: CurrentUser,
        filters: dict,
    ) -> dict:
        if self.is_league_leadership(user):
            return filters

        filters = dict(filters)
        club_ids = await self.get_club_ids_for_user(db, user)
        if user.role is UserRole.PLAYER:
            filters["user_profile_id"] = str(user.id)
        elif club_ids:
            filters["club_id"] = [str(club_id) for club_id in club_ids]
        return filters

    async def scope_registration_filters(
        self,
        db: AsyncSession,
        user: CurrentUser,
        filters: dict,
    ) -> dict:
        if self.is_federation_admin(user):
            return filters

        if user.role is UserRole.LEAGUE_COORDINATOR:
            return await self._scope_by_coordinator_leagues(db, user, filters, field="club_id")

        filters = dict(filters)
        if user.role is UserRole.PLAYER:
            player = await self.get_player_for_user(db, user)
            if player:
                filters["player_id"] = str(player.id)
            return filters

        club_ids = await self.get_club_ids_for_user(db, user)
        if club_ids:
            filters["club_id"] = [str(club_id) for club_id in club_ids]
        return filters

    async def scope_transfer_filters(
        self,
        db: AsyncSession,
        user: CurrentUser,
        filters: dict,
    ) -> dict:
        if self.is_federation_admin(user):
            return filters

        if user.role is UserRole.LEAGUE_COORDINATOR:
            club_ids = await self._club_ids_for_coordinator(db, user)
            transfer_ids = await self.get_transfer_ids_for_clubs(db, club_ids)
            filters = dict(filters)
            filters["id"] = [str(item) for item in transfer_ids] or [str(UUID(int=0))]
            return filters

        filters = dict(filters)
        if user.role is UserRole.PLAYER:
            player = await self.get_player_for_user(db, user)
            if player:
                registration_ids = await self.get_registration_ids_for_player(db, player.id)
                filters["registration_id"] = [str(item) for item in registration_ids] or [
                    str(UUID(int=0))
                ]
            return filters

        club_ids = await self.get_club_ids_for_user(db, user)
        transfer_ids = await self.get_transfer_ids_for_clubs(db, club_ids)
        filters["id"] = [str(item) for item in transfer_ids] or [str(UUID(int=0))]
        return filters

    async def scope_transfer_approval_filters(
        self,
        db: AsyncSession,
        user: CurrentUser,
        filters: dict,
    ) -> dict:
        if self.is_league_leadership(user):
            return filters

        transfer_filters = await self.scope_transfer_filters(db, user, {})
        transfer_ids = transfer_filters.get("id", [])
        filters = dict(filters)
        filters["transfer_id"] = transfer_ids
        return filters

    async def scope_document_filters(
        self,
        db: AsyncSession,
        user: CurrentUser,
        filters: dict,
    ) -> dict:
        if self.is_league_leadership(user):
            return filters

        transfer_filters = await self.scope_transfer_filters(db, user, {})
        transfer_ids = transfer_filters.get("id", [])
        filters = dict(filters)
        filters["transfer_id"] = transfer_ids
        return filters

    async def scope_notification_filters(
        self,
        db: AsyncSession,
        user: CurrentUser,
        filters: dict,
    ) -> dict:
        if self.is_federation_admin(user):
            return filters
        filters = dict(filters)
        filters["user_profile_id"] = str(user.id)
        return filters

    def ensure_can_read_user_profile(self, user: CurrentUser, profile: UserProfile) -> None:
        if self.is_league_leadership(user):
            return
        if profile.id != user.id:
            raise Forbidden("You can only access your own user profile.")

    def ensure_can_read_player(self, user: CurrentUser, player: Player) -> None:
        if self.is_league_leadership(user):
            return
        if user.role is UserRole.PLAYER and player.user_profile_id == user.id:
            return
        raise Forbidden("You do not have permission to access this player.")

    async def ensure_can_read_player_with_clubs(
        self,
        db: AsyncSession,
        user: CurrentUser,
        player: Player,
    ) -> None:
        if self.is_league_leadership(user):
            return
        if user.role is UserRole.PLAYER:
            if player.user_profile_id == user.id:
                return
            raise Forbidden("You do not have permission to access this player.")

        club_ids = await self.get_club_ids_for_user(db, user)
        if not club_ids:
            raise Forbidden("You do not have permission to access this player.")

        result = await db.execute(
            select(Registration.id).where(
                Registration.player_id == player.id,
                Registration.club_id.in_(club_ids),
            ).limit(1)
        )
        if result.scalar_one_or_none() is None:
            raise Forbidden("You do not have permission to access this player.")

    async def ensure_can_manage_player_external_account(
        self,
        db: AsyncSession,
        user: CurrentUser,
        player: Player,
    ) -> None:
        if user.role is UserRole.PLAYER and player.user_profile_id == user.id:
            return
        await self.ensure_can_read_player_with_clubs(db, user, player)

    def ensure_can_admin_verify_external_account(self, user: CurrentUser) -> None:
        if self.is_club_leadership(user):
            return
        raise Forbidden("Only club leadership can perform admin account verification.")

    async def ensure_can_read_club(self, db: AsyncSession, user: CurrentUser, club: Club) -> None:
        if self.is_league_leadership(user):
            return
        if user.role is UserRole.CLUB_ADMIN:
            club_ids = await self.get_club_ids_for_user(db, user)
            if club.id in club_ids:
                return
        raise Forbidden("You do not have permission to access this club.")

    async def ensure_can_manage_club(self, db: AsyncSession, user: CurrentUser, club: Club) -> None:
        if self.is_federation_admin(user):
            return
        if user.role is UserRole.CLUB_ADMIN:
            club_ids = await self.get_club_ids_for_user(db, user)
            if club.id in club_ids:
                return
        raise Forbidden("You do not have permission to manage this club.")

    async def ensure_can_read_club_member(
        self,
        db: AsyncSession,
        user: CurrentUser,
        member: ClubMember,
    ) -> None:
        if self.is_league_leadership(user):
            return
        if user.role is UserRole.PLAYER and member.user_profile_id == user.id:
            return
        club_ids = await self.get_club_ids_for_user(db, user)
        if member.club_id in club_ids:
            return
        raise Forbidden("You do not have permission to access this club member.")

    async def ensure_can_manage_club_member(
        self,
        db: AsyncSession,
        user: CurrentUser,
        member: ClubMember,
    ) -> None:
        await self.ensure_can_manage_club_by_id(db, user, member.club_id)

    async def ensure_can_manage_club_by_id(
        self,
        db: AsyncSession,
        user: CurrentUser,
        club_id: UUID,
    ) -> None:
        if self.is_federation_admin(user):
            return
        if user.role is UserRole.CLUB_ADMIN:
            club_ids = await self.get_club_ids_for_user(db, user)
            if club_id in club_ids:
                return
        raise Forbidden("You do not have permission to manage this club.")

    async def ensure_can_read_registration(
        self,
        db: AsyncSession,
        user: CurrentUser,
        registration: Registration,
    ) -> None:
        if self.is_league_leadership(user):
            return
        if user.role is UserRole.PLAYER:
            player = await self.get_player_for_user(db, user)
            if player and registration.player_id == player.id:
                return
            raise Forbidden("You do not have permission to access this registration.")
        club_ids = await self.get_club_ids_for_user(db, user)
        if registration.club_id in club_ids:
            return
        raise Forbidden("You do not have permission to access this registration.")

    async def ensure_can_read_transfer(
        self,
        db: AsyncSession,
        user: CurrentUser,
        transfer: Transfer,
    ) -> None:
        if self.is_league_leadership(user):
            return
        if user.role is UserRole.PLAYER:
            player = await self.get_player_for_user(db, user)
            if player:
                result = await db.execute(
                    select(Registration.id).where(
                        Registration.id == transfer.registration_id,
                        Registration.player_id == player.id,
                    ).limit(1)
                )
                if result.scalar_one_or_none():
                    return
            raise Forbidden("You do not have permission to access this transfer.")
        club_ids = await self.get_club_ids_for_user(db, user)
        if transfer.from_club_id in club_ids or transfer.to_club_id in club_ids:
            return
        raise Forbidden("You do not have permission to access this transfer.")

    async def ensure_can_read_transfer_approval(
        self,
        db: AsyncSession,
        user: CurrentUser,
        approval: TransferApproval,
    ) -> None:
        transfer = await db.get(Transfer, approval.transfer_id)
        if transfer is None:
            raise Forbidden("You do not have permission to access this transfer approval.")
        await self.ensure_can_read_transfer(db, user, transfer)

    async def ensure_can_read_document(
        self,
        db: AsyncSession,
        user: CurrentUser,
        document: Document,
    ) -> None:
        transfer = await db.get(Transfer, document.transfer_id)
        if transfer is None:
            raise Forbidden("You do not have permission to access this document.")
        await self.ensure_can_read_transfer(db, user, transfer)

    def ensure_can_read_notification(self, user: CurrentUser, notification: Notification) -> None:
        if self.is_federation_admin(user):
            return
        if notification.user_profile_id != user.id:
            raise Forbidden("You can only access your own notifications.")

    def ensure_can_update_notification(self, user: CurrentUser, notification: Notification) -> None:
        if self.is_federation_admin(user):
            return
        if notification.user_profile_id != user.id:
            raise Forbidden("You can only update your own notifications.")

    def ensure_audit_log_access(self, user: CurrentUser) -> None:
        if not self.is_league_leadership(user):
            raise Forbidden("You do not have permission to access audit logs.")

    async def ensure_can_manage_season(
        self,
        db: AsyncSession,
        user: CurrentUser,
        season: Season,
    ) -> None:
        if self.is_federation_admin(user):
            return
        if user.role is UserRole.LEAGUE_COORDINATOR:
            profile = await db.get(UserProfile, user.id)
            league_ids = profile.coordinator_league_ids if profile else None
            if not league_ids:
                return
        raise Forbidden("You do not have permission to manage this season.")

    async def _club_ids_for_coordinator(self, db: AsyncSession, user: CurrentUser) -> list[UUID]:
        profile = await db.get(UserProfile, user.id)
        league_ids = profile.coordinator_league_ids if profile else []
        if not league_ids:
            return []
        result = await db.execute(select(Club.id).where(Club.league_id.in_(league_ids)))
        return list(result.scalars().all())

    async def _scope_by_coordinator_leagues(
        self,
        db: AsyncSession,
        user: CurrentUser,
        filters: dict,
        *,
        field: str,
    ) -> dict:
        club_ids = await self._club_ids_for_coordinator(db, user)
        filters = dict(filters)
        filters[field] = [str(club_id) for club_id in club_ids] or [str(UUID(int=0))]
        return filters
