from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import DuplicateResource, Forbidden, ResourceNotFound, ValidationError
from app.dependencies.auth import CurrentUser
from app.models.audit_log import AuditLog
from app.models.club_captain_application import ClubCaptainApplication
from app.models.enums import ApplicationStatus, UserRole
from app.models.league import League
from app.models.player import Player
from app.models.player_profile_application import PlayerProfileApplication
from app.models.user_profile import UserProfile
from app.repositories.application_repository import (
    ClubCaptainApplicationRepository,
    PlayerProfileApplicationRepository,
)
from app.repositories.league_repository import LeagueRepository
from app.repositories.user_profile_repository import UserProfileRepository
from app.schemas.application import (
    ApplicationReview,
    ClubCaptainApplicationCreate,
    CoordinatorCreate,
    PlayerProfileApplicationCreate,
)
from app.services.email_service import EmailService
from app.services.email_verification_token import EmailVerificationTokenPayload
from app.services.otp_service import OtpService
from app.services.provisioning_service import ProvisioningService


class ApplicationService:
    def __init__(self) -> None:
        self.club_repository = ClubCaptainApplicationRepository()
        self.player_repository = PlayerProfileApplicationRepository()
        self.league_repository = LeagueRepository()
        self.user_profile_repository = UserProfileRepository()
        self.provisioning_service = ProvisioningService()
        self.email_service = EmailService()
        self.otp_service = OtpService()

    async def submit_club_application(
        self,
        db: AsyncSession,
        data: ClubCaptainApplicationCreate,
        verification: EmailVerificationTokenPayload,
    ) -> ClubCaptainApplication:
        captain_email = self.otp_service.normalize_email(str(data.captain_email))
        if verification.email != captain_email:
            raise Forbidden("Verification token email does not match application email.")

        league = await self.league_repository.get_by_id(db, data.league_id)
        if not league:
            raise ResourceNotFound("League not found.")

        if await self.club_repository.has_pending_for_email(db, captain_email):
            raise DuplicateResource("A pending club application already exists for this email.")

        now = datetime.now(timezone.utc)
        application = ClubCaptainApplication(
            club_name=data.club_name.strip(),
            county=data.county.strip(),
            league_id=data.league_id,
            description=data.description,
            captain_first_name=data.captain_first_name.strip(),
            captain_last_name=data.captain_last_name.strip(),
            captain_email=captain_email,
            captain_phone=data.captain_phone.strip(),
            status=ApplicationStatus.PENDING,
            email_verified_at=now,
        )
        db.add(application)
        await db.commit()
        await db.refresh(application)

        await self.email_service.send_application_received(
            email=captain_email,
            application_type="club captain",
        )
        return application

    async def submit_player_application(
        self,
        db: AsyncSession,
        data: PlayerProfileApplicationCreate,
        verification: EmailVerificationTokenPayload,
    ) -> PlayerProfileApplication:
        email = self.otp_service.normalize_email(str(data.email))
        if verification.email != email:
            raise Forbidden("Verification token email does not match application email.")

        if await self.player_repository.has_pending_for_email(db, email):
            raise DuplicateResource("A pending player application already exists for this email.")

        now = datetime.now(timezone.utc)
        application = PlayerProfileApplication(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=email,
            county=data.county.strip(),
            nationality=data.nationality.strip(),
            status=ApplicationStatus.PENDING,
            email_verified_at=now,
        )
        db.add(application)
        await db.commit()
        await db.refresh(application)

        await self.email_service.send_application_received(
            email=email,
            application_type="player profile",
        )
        return application

    async def list_club_applications(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        *,
        filters: dict | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        self._ensure_reviewer(actor)
        scoped_filters = await self._scope_club_application_filters(db, actor, filters or {})
        return await self.club_repository.get_all(
            db,
            filters=scoped_filters,
            sort_by="created_at",
            sort_order="desc",
            page=page,
            page_size=page_size,
        )

    async def count_club_applications(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        *,
        filters: dict | None = None,
    ) -> int:
        self._ensure_reviewer(actor)
        scoped_filters = await self._scope_club_application_filters(db, actor, filters or {})
        return await self.club_repository.count(db, filters=scoped_filters)

    async def list_player_applications(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        *,
        filters: dict | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        self._ensure_reviewer(actor)
        return await self.player_repository.get_all(
            db,
            filters=filters or {},
            sort_by="created_at",
            sort_order="desc",
            page=page,
            page_size=page_size,
        )

    async def count_player_applications(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        *,
        filters: dict | None = None,
    ) -> int:
        self._ensure_reviewer(actor)
        return await self.player_repository.count(db, filters=filters or {})

    async def get_club_application(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        application_id: UUID,
    ) -> ClubCaptainApplication:
        self._ensure_reviewer(actor)
        application = await self.club_repository.get_by_id(db, application_id)
        if not application:
            raise ResourceNotFound("Club application not found.")
        await self._ensure_can_review_club_application(db, actor, application)
        return application

    async def get_player_application(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        application_id: UUID,
    ) -> PlayerProfileApplication:
        self._ensure_reviewer(actor)
        application = await self.player_repository.get_by_id(db, application_id)
        if not application:
            raise ResourceNotFound("Player application not found.")
        return application

    async def review_club_application(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        application_id: UUID,
        review: ApplicationReview,
    ) -> ClubCaptainApplication:
        application = await self.get_club_application(db, actor, application_id)
        self._ensure_pending(application)

        now = datetime.now(timezone.utc)
        application.reviewed_by_id = actor.id
        application.reviewed_at = now

        if review.status is ApplicationStatus.APPROVED:
            provisioned = await self.provisioning_service.provision_captain(
                db,
                email=application.captain_email,
                first_name=application.captain_first_name,
                last_name=application.captain_last_name,
                phone=application.captain_phone,
                club_name=application.club_name,
                county=application.county,
                league_id=application.league_id,
                description=application.description,
            )
            application.status = ApplicationStatus.APPROVED
            application.created_club_id = provisioned["club_id"]
            application.created_captain_id = provisioned["user_profile_id"]
            await self._audit(
                db,
                actor_id=actor.id,
                action="club_application.approved",
                entity_id=application.id,
            )
            await self.email_service.send_welcome_email(
                email=application.captain_email,
                role="club captain",
                sign_in_url=self._sign_in_url(),
                temporary_password=provisioned.get("temporary_password"),
            )
        else:
            application.status = ApplicationStatus.REJECTED
            application.rejection_reason = review.rejection_reason
            await self._audit(
                db,
                actor_id=actor.id,
                action="club_application.rejected",
                entity_id=application.id,
            )
            await self.email_service.send_rejection_email(
                email=application.captain_email,
                application_type="club captain",
                rejection_reason=review.rejection_reason or "",
            )

        await db.commit()
        await db.refresh(application)
        return application

    async def review_player_application(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        application_id: UUID,
        review: ApplicationReview,
    ) -> PlayerProfileApplication:
        application = await self.get_player_application(db, actor, application_id)
        self._ensure_pending(application)

        now = datetime.now(timezone.utc)
        application.reviewed_by_id = actor.id
        application.reviewed_at = now

        if review.status is ApplicationStatus.APPROVED:
            federation_id = await self._next_federation_id(db)
            provisioned = await self.provisioning_service.provision_player(
                db,
                email=application.email,
                first_name=application.first_name,
                last_name=application.last_name,
                phone=None,
                county=application.county,
                nationality=application.nationality,
                federation_id=federation_id,
            )
            application.status = ApplicationStatus.APPROVED
            application.federation_id = federation_id
            application.created_player_id = provisioned["player_id"]
            await self._audit(
                db,
                actor_id=actor.id,
                action="player_application.approved",
                entity_id=application.id,
            )
            await self.email_service.send_welcome_email(
                email=application.email,
                role="player",
                sign_in_url=self._sign_in_url(),
                temporary_password=provisioned.get("temporary_password"),
            )
        else:
            application.status = ApplicationStatus.REJECTED
            application.rejection_reason = review.rejection_reason
            await self._audit(
                db,
                actor_id=actor.id,
                action="player_application.rejected",
                entity_id=application.id,
            )
            await self.email_service.send_rejection_email(
                email=application.email,
                application_type="player profile",
                rejection_reason=review.rejection_reason or "",
            )

        await db.commit()
        await db.refresh(application)
        return application

    async def create_coordinator(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        data: CoordinatorCreate,
    ) -> UserProfile:
        if actor.role is not UserRole.FEDERATION_ADMIN:
            raise Forbidden("Only federation administrators can create coordinators.")

        for league_id in data.league_ids:
            league = await self.league_repository.get_by_id(db, league_id)
            if not league:
                raise ResourceNotFound(f"League not found: {league_id}")

        provisioned = await self.provisioning_service.provision_coordinator(
            db,
            email=str(data.email),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            league_ids=data.league_ids,
        )
        profile_id = provisioned["user_profile_id"]
        await self._audit(
            db,
            actor_id=actor.id,
            action="user.coordinator_created",
            entity_id=profile_id,
        )
        await self.email_service.send_welcome_email(
            email=str(data.email),
            role="league coordinator",
            sign_in_url=self._sign_in_url(),
            temporary_password=provisioned.get("temporary_password"),
        )
        await db.commit()
        profile = await self.user_profile_repository.get_by_id(db, profile_id)
        if not profile:
            raise ResourceNotFound("Coordinator profile not found after provisioning.")
        return profile

    async def league_name_for(self, db: AsyncSession, league_id: UUID) -> str | None:
        league = await self.league_repository.get_by_id(db, league_id)
        return league.name if league else None

    def _sign_in_url(self) -> str:
        return f"{settings.frontend_url.rstrip('/')}/login"

    def _ensure_reviewer(self, actor: CurrentUser) -> None:
        if actor.role not in {UserRole.FEDERATION_ADMIN, UserRole.LEAGUE_COORDINATOR}:
            raise Forbidden("Only league coordinators or federation admins can review applications.")

    def _ensure_pending(self, application: ClubCaptainApplication | PlayerProfileApplication) -> None:
        if application.status is not ApplicationStatus.PENDING:
            raise DuplicateResource("This application has already been reviewed.")

    async def _scope_club_application_filters(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        filters: dict,
    ) -> dict:
        if actor.role is UserRole.FEDERATION_ADMIN:
            return filters

        profile = await self.user_profile_repository.get_by_id(db, actor.id)
        league_ids = profile.coordinator_league_ids if profile else None
        if not league_ids:
            filters = dict(filters)
            filters["league_id"] = [str(UUID(int=0))]
            return filters

        filters = dict(filters)
        filters["league_id"] = [str(league_id) for league_id in league_ids]
        return filters

    async def _ensure_can_review_club_application(
        self,
        db: AsyncSession,
        actor: CurrentUser,
        application: ClubCaptainApplication,
    ) -> None:
        if actor.role is UserRole.FEDERATION_ADMIN:
            return
        profile = await self.user_profile_repository.get_by_id(db, actor.id)
        league_ids = profile.coordinator_league_ids if profile else []
        if application.league_id not in league_ids:
            raise Forbidden("You do not have permission to review this club application.")

    async def _next_federation_id(self, db: AsyncSession) -> str:
        result = await db.execute(
            select(Player.federation_id).where(Player.federation_id.isnot(None))
        )
        max_number = 2500
        for federation_id in result.scalars():
            if federation_id and federation_id.startswith("KEN-"):
                try:
                    max_number = max(max_number, int(federation_id.split("-", 1)[1]))
                except ValueError:
                    continue
        return f"KEN-{max_number + 1}"

    async def _audit(
        self,
        db: AsyncSession,
        *,
        actor_id: UUID | None = None,
        action: str,
        entity_id: UUID,
    ) -> None:
        db.add(
            AuditLog(
                user_profile_id=actor_id,
                action=action,
                entity="application",
                entity_id=entity_id,
            )
        )
        await db.flush()
