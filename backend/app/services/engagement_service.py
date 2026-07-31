from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResource, Forbidden, ResourceNotFound, ValidationError
from app.dependencies.auth import CurrentUser
from app.models.club import Club
from app.models.enums import (
    EngagementRecipientType,
    EngagementStatus,
    PlayerCommitmentStatus,
    RegistrationStatus,
)
from app.models.player import Player
from app.models.player_engagement import PlayerEngagement
from app.models.registration import Registration
from app.models.user_profile import UserProfile
from app.repositories.engagement_repository import EngagementRepository
from app.repositories.player_repository import PlayerRepository
from app.schemas.engagement import EngagementCreate, EngagementUpdate
from app.services.base_services import BaseService


class EngagementService(BaseService[PlayerEngagement]):
    def __init__(self):
        super().__init__(EngagementRepository())
        self.player_repository = PlayerRepository()

    async def create(
        self,
        db: AsyncSession,
        data: EngagementCreate,
        actor: CurrentUser,
    ) -> PlayerEngagement:
        player = await self.player_repository.get_by_id(db, data.player_id)
        if not player:
            raise ResourceNotFound("Player not found.")

        club_ids = await self._club_ids_for_user(db, actor)
        if not club_ids:
            raise ValidationError("Club captains must belong to a club to send engagements.")
        requesting_club_id = club_ids[0]

        commitment, current_club_id = await self._derive_commitment(db, player.id)
        if current_club_id == requesting_club_id:
            raise ValidationError("You cannot express interest in a player on your own roster.")

        existing = await self.repository.get_pending_for_club_player(
            db,
            requesting_club_id=requesting_club_id,
            player_id=player.id,
        )
        if existing:
            raise DuplicateResource("A pending engagement already exists for this player.")

        recipient_type = (
            EngagementRecipientType.PLAYER
            if commitment is PlayerCommitmentStatus.FREE_AGENT
            else EngagementRecipientType.CLUB_CAPTAIN
        )
        recipient_club_id = None if recipient_type is EngagementRecipientType.PLAYER else current_club_id

        engagement = PlayerEngagement(
            player_id=player.id,
            requesting_club_id=requesting_club_id,
            requesting_captain_id=actor.id,
            recipient_type=recipient_type,
            recipient_club_id=recipient_club_id,
            message=data.message,
            status=EngagementStatus.PENDING,
            player_commitment_status=commitment,
        )
        db.add(engagement)
        await db.commit()
        await db.refresh(engagement)
        return engagement

    async def update_status(
        self,
        db: AsyncSession,
        engagement_id: UUID,
        data: EngagementUpdate,
        actor: CurrentUser,
    ) -> PlayerEngagement:
        engagement = await self.get(db, engagement_id)
        if engagement.status is not EngagementStatus.PENDING:
            raise DuplicateResource("This engagement has already been responded to.")

        if data.status not in {
            EngagementStatus.ACCEPTED,
            EngagementStatus.DECLINED,
            EngagementStatus.WITHDRAWN,
        }:
            raise ValidationError("Invalid engagement status transition.")

        if data.status is EngagementStatus.WITHDRAWN:
            if engagement.requesting_captain_id != actor.id:
                raise Forbidden("Only the requesting captain can withdraw an engagement.")
        else:
            await self._ensure_recipient(db, actor, engagement)

        engagement.status = data.status
        engagement.responded_at = datetime.now(timezone.utc)
        db.add(engagement)
        await db.commit()
        await db.refresh(engagement)
        return engagement

    async def _derive_commitment(
        self,
        db: AsyncSession,
        player_id: UUID,
    ) -> tuple[PlayerCommitmentStatus, UUID | None]:
        result = await db.execute(
            select(Registration)
            .where(
                Registration.player_id == player_id,
                Registration.status == RegistrationStatus.APPROVED,
            )
            .order_by(Registration.registered_at.desc())
            .limit(1)
        )
        registration = result.scalar_one_or_none()
        if registration:
            return PlayerCommitmentStatus.COMMITTED, registration.club_id
        return PlayerCommitmentStatus.FREE_AGENT, None

    async def _club_ids_for_user(self, db: AsyncSession, user: CurrentUser) -> list[UUID]:
        from app.services.authorization_service import AuthorizationService

        return await AuthorizationService().get_club_ids_for_user(db, user)

    async def _ensure_recipient(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        engagement: PlayerEngagement,
    ) -> None:
        if engagement.recipient_type is EngagementRecipientType.PLAYER:
            player = await self.player_repository.get_by_id(db, engagement.player_id)
            if not player or player.user_profile_id != actor.id:
                raise Forbidden("Only the target player can respond to this engagement.")
            return

        club_ids = await self._club_ids_for_user(db, actor)
        if engagement.recipient_club_id not in club_ids:
            raise Forbidden("Only the recipient club captain can respond to this engagement.")


class PlayerListingService:
    async def list_public(
        self,
        db: AsyncSession,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        commitment_status: PlayerCommitmentStatus | None = None,
        county: str | None = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> dict:
        query = (
            select(Player, UserProfile)
            .join(UserProfile, Player.user_profile_id == UserProfile.id)
        )
        if search:
            pattern = f"%{search}%"
            query = query.where(
                or_(
                    UserProfile.first_name.ilike(pattern),
                    UserProfile.last_name.ilike(pattern),
                    Player.federation_id.ilike(pattern),
                    Player.lichess_username.ilike(pattern),
                    Player.chesscom_username.ilike(pattern),
                )
            )

        result = await db.execute(query)
        rows = result.all()
        items = []
        for player, profile in rows:
            commitment, club_id = await EngagementService()._derive_commitment(db, player.id)
            if commitment_status and commitment != commitment_status:
                continue

            club = await db.get(Club, club_id) if club_id else None
            if county and (not club or (club.county or "").lower() != county.lower()):
                continue
            if player.headshot_moderation_status != "APPROVED":
                headshot_url = None
            else:
                from app.services.storage_service import StorageService

                storage = StorageService()
                headshot_url = await storage.resolve_public_url(player.headshot_url)

            items.append(
                {
                    "id": player.id,
                    "federation_id": player.federation_id,
                    "name": f"{profile.first_name} {profile.last_name}".strip(),
                    "commitment_status": commitment,
                    "club": {"id": club.id, "name": club.name} if club else None,
                    "county": club.county if club else None,
                    "fide_id": player.fide_id,
                    "fide_rating": player.classical_rating,
                    "blitz_rating": player.blitz_rating,
                    "rapid_rating": player.rapid_rating,
                    "classical_rating": player.classical_rating,
                    "lichess_username": player.lichess_username,
                    "chesscom_username": player.chesscom_username,
                    "lichess_verified": player.lichess_verified,
                    "chesscom_verified": player.chesscom_verified,
                    "nationality": player.nationality,
                    "headshot_url": headshot_url,
                    "last_active": player.updated_at,
                }
            )

        reverse = sort_order.lower() == "desc"
        if sort_by == "fide_rating":
            items.sort(key=lambda item: item["fide_rating"] or 0, reverse=reverse)
        else:
            items.sort(key=lambda item: item["name"].lower(), reverse=reverse)

        total = len(items)
        start = (page - 1) * page_size
        end = start + page_size
        return {"items": items[start:end], "total": total}
