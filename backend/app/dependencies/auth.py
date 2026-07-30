"""Shared authorization dependencies."""

from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import Forbidden, Unauthorized, ValidationError
from app.core.security import decode_supabase_token
from app.dependencies.dependencies import get_db
from app.models.enums import UserRole
from app.repositories.user_profile_repository import UserProfileRepository

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    auto_error=False,
    scheme_name="BearerAuth",
)


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


async def _build_mock_user(
    db: AsyncSession,
    mock_role: str | None,
    mock_user_id: UUID | None,
    mock_email: str | None,
) -> CurrentUser:
    if mock_user_id:
        profile = await UserProfileRepository().get_by_id(db, mock_user_id)
        if profile:
            return CurrentUser(
                id=profile.id,
                auth_user_id=profile.auth_user_id,
                email=mock_email or f"{profile.first_name.lower()}.{profile.last_name.lower()}@kncl.local",
                role=profile.role,
            )

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


async def resolve_current_user(
    db: AsyncSession,
    *,
    token: str | None = None,
    authorization: str | None = None,
    mock_role: str | None = None,
    mock_user_id: UUID | None = None,
    mock_email: str | None = None,
) -> CurrentUser:
    """Resolve the current user from a bearer token or development mock headers."""
    bearer_token = token
    if not bearer_token and authorization:
        scheme, _, raw_token = authorization.partition(" ")
        if scheme.lower() == "bearer" and raw_token.strip():
            bearer_token = raw_token.strip()

    if bearer_token:
        return await _authenticate_supabase_token(db, bearer_token)

    if _mock_auth_allowed():
        return await _build_mock_user(db, mock_role, mock_user_id, mock_email)

    raise Unauthorized("Authentication is required.")


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    authorization: str | None = Header(default=None),
    mock_role: str | None = Header(default=None, alias="X-Mock-Role"),
    mock_user_id: UUID | None = Header(default=None, alias="X-Mock-User-ID"),
    mock_email: str | None = Header(default=None, alias="X-Mock-Email"),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    """Return the authenticated user from a Supabase JWT or development mock headers."""
    return await resolve_current_user(
        db,
        token=token,
        authorization=authorization,
        mock_role=mock_role,
        mock_user_id=mock_user_id,
        mock_email=mock_email,
    )


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
