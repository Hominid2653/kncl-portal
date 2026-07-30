import secrets
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, ValidationError
from app.core.logging import logger
from app.models.club import Club
from app.models.club_member import ClubMember
from app.models.enums import UserRole
from app.models.player import Player
from app.models.user_profile import UserProfile
from app.repositories.user_profile_repository import UserProfileRepository


class ProvisioningService:
    """Creates Supabase auth users and domain profiles on application approval."""

    def __init__(self) -> None:
        self.user_profile_repository = UserProfileRepository()

    def _admin_headers(self) -> dict[str, str]:
        return {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }

    async def _create_or_get_auth_user_id(
        self,
        *,
        email: str,
        first_name: str,
        last_name: str,
    ) -> tuple[UUID, str | None]:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise ExternalServiceError("Supabase admin provisioning is not configured.")

        normalized_email = email.strip().lower()
        password = secrets.token_urlsafe(12)
        payload = {
            "email": normalized_email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "first_name": first_name,
                "last_name": last_name,
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users",
                headers=self._admin_headers(),
                json=payload,
            )

            if response.status_code == 422:
                existing = await self._get_auth_user_id_by_email(client, normalized_email)
                if existing:
                    return existing, None
                raise ValidationError("Unable to provision auth user for this email.")

            if response.status_code >= 400:
                logger.error(
                    "supabase.admin_create_user.failed status=%s body=%s",
                    response.status_code,
                    response.text,
                )
                raise ExternalServiceError("Unable to provision auth user at this time.")

            auth_user_id = response.json().get("id")
            if not auth_user_id:
                raise ExternalServiceError("Supabase did not return a user id.")
            return UUID(str(auth_user_id)), password

    async def _get_auth_user_id_by_email(
        self,
        client: httpx.AsyncClient,
        email: str,
    ) -> UUID | None:
        response = await client.get(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users",
            headers=self._admin_headers(),
            params={"email": email},
        )
        if response.status_code >= 400:
            return None
        users = response.json().get("users", [])
        if not users:
            return None
        return UUID(str(users[0]["id"]))

    async def _get_or_create_user_profile(
        self,
        db: AsyncSession,
        *,
        auth_user_id: UUID,
        first_name: str,
        last_name: str,
        phone: str | None,
        role: UserRole,
        coordinator_league_ids: list[UUID] | None = None,
    ) -> UserProfile:
        existing = await self.user_profile_repository.get_by_auth_user_id(db, auth_user_id)
        if existing:
            return existing

        profile = UserProfile(
            auth_user_id=auth_user_id,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role,
            coordinator_league_ids=coordinator_league_ids,
        )
        db.add(profile)
        await db.flush()
        return profile

    async def provision_captain(
        self,
        db: AsyncSession,
        *,
        email: str,
        first_name: str,
        last_name: str,
        phone: str,
        club_name: str,
        county: str,
        league_id: UUID,
        description: str | None,
    ) -> dict[str, UUID | str | None]:
        auth_user_id, temp_password = await self._create_or_get_auth_user_id(
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        profile = await self._get_or_create_user_profile(
            db,
            auth_user_id=auth_user_id,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=UserRole.CLUB_ADMIN,
        )

        club = Club(
            league_id=league_id,
            name=club_name,
            county=county,
            description=description,
            initial_roster_period_active=True,
            approved_roster_count=0,
        )
        db.add(club)
        await db.flush()

        db.add(
            ClubMember(
                club_id=club.id,
                user_profile_id=profile.id,
                position="Captain",
            )
        )
        await db.flush()

        return {
            "auth_user_id": auth_user_id,
            "user_profile_id": profile.id,
            "club_id": club.id,
            "temporary_password": temp_password,
        }

    async def provision_player(
        self,
        db: AsyncSession,
        *,
        email: str,
        first_name: str,
        last_name: str,
        phone: str | None,
        county: str,
        nationality: str,
        federation_id: str | None = None,
    ) -> dict[str, UUID | str | None]:
        auth_user_id, temp_password = await self._create_or_get_auth_user_id(
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        profile = await self._get_or_create_user_profile(
            db,
            auth_user_id=auth_user_id,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=UserRole.PLAYER,
        )

        existing_player = await db.execute(
            select(Player).where(Player.user_profile_id == profile.id)
        )
        player = existing_player.scalar_one_or_none()
        if not player:
            player = Player(
                user_profile_id=profile.id,
                federation_id=federation_id,
                nationality=nationality,
            )
            db.add(player)
            await db.flush()

        return {
            "auth_user_id": auth_user_id,
            "user_profile_id": profile.id,
            "player_id": player.id,
            "temporary_password": temp_password,
        }

    async def provision_coordinator(
        self,
        db: AsyncSession,
        *,
        email: str,
        first_name: str,
        last_name: str,
        phone: str | None,
        league_ids: list[UUID],
    ) -> dict[str, UUID | str | None]:
        auth_user_id, temp_password = await self._create_or_get_auth_user_id(
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        profile = await self._get_or_create_user_profile(
            db,
            auth_user_id=auth_user_id,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=UserRole.LEAGUE_COORDINATOR,
            coordinator_league_ids=league_ids or None,
        )
        return {
            "user_profile_id": profile.id,
            "temporary_password": temp_password,
        }
