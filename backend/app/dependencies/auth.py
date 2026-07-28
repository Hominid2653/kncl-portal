"""Shared authorization dependencies."""

from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import Forbidden, Unauthorized, ValidationError
from app.core.security import decode_supabase_token
from app.dependencies.dependencies import get_db
from app.models.enums import UserRole
from app.repositories.user_profile_repository import UserProfileRepository


class CurrentUser(BaseModel):
    id: UUID
    email: str
    role: UserRole
    auth_user_id: UUID


def _mock_auth_allowed() -> bool:
    return settings.auth_mock_enabled and settings.app_env.lower() in {
        "development",
        "test",
        "testing",
    }


def _mock_role(value: str) -> UserRole:
    try:
        return UserRole(value.upper())
    except ValueError as exc:
        valid_roles = ", ".join(role.value for role in UserRole)
        raise ValidationError(f"X-Mock-Role must be one of: {valid_roles}.") from exc


def _build_mock_user(
    mock_role: str | None,
    mock_user_id: UUID | None,
    mock_email: str | None,
) -> CurrentUser:
    profile_id = mock_user_id or UUID("00000000-0000-0000-0000-000000000001")
    return CurrentUser(
        id=profile_id,
        auth_user_id=profile_id,
        email=mock_email or "mock-user@kncl.local",
        role=_mock_role(mock_role or settings.auth_mock_default_role),
    )


async def _authenticate_supabase_token(db: AsyncSession, token: str) -> CurrentUser:
    payload = decode_supabase_token(token)
    profile = await UserProfileRepository().get_by_auth_user_id(db, payload.auth_user_id)

    if not profile:
        raise Forbidden("No application profile exists for this authenticated user.")

    return CurrentUser(
        id=profile.id,
        auth_user_id=profile.auth_user_id,
        email=payload.email or f"{profile.first_name}.{profile.last_name}@kncl.local",
        role=profile.role,
    )


async def get_current_user(
    authorization: str | None = Header(default=None),
    mock_role: str | None = Header(default=None, alias="X-Mock-Role"),
    mock_user_id: UUID | None = Header(default=None, alias="X-Mock-User-ID"),
    mock_email: str | None = Header(default=None, alias="X-Mock-Email"),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    """Return the authenticated user from a Supabase JWT or development mock headers."""
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token.strip():
            raise Unauthorized("Invalid authorization header.")
        return await _authenticate_supabase_token(db, token.strip())

    if _mock_auth_allowed():
        return _build_mock_user(mock_role, mock_user_id, mock_email)

    raise Unauthorized("Authentication is required.")


def require_role(*roles: UserRole) -> Callable:
    """Create a FastAPI dependency that permits only one of the supplied roles."""
    if not roles:
        raise ValueError("At least one role is required.")

    async def role_guard(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if current_user.role not in roles:
            required_roles = ", ".join(role.value for role in roles)
            raise Forbidden(f"This action requires one of: {required_roles}.")
        return current_user

    return role_guard


require_club_admin = require_role(UserRole.CLUB_ADMIN)
require_league_coordinator = require_role(UserRole.LEAGUE_COORDINATOR)
require_federation_admin = require_role(UserRole.FEDERATION_ADMIN)

require_league_leadership = require_role(
    UserRole.FEDERATION_ADMIN,
    UserRole.LEAGUE_COORDINATOR,
)
require_club_leadership = require_role(
    UserRole.FEDERATION_ADMIN,
    UserRole.LEAGUE_COORDINATOR,
    UserRole.CLUB_ADMIN,
)

require_authenticated = get_current_user
