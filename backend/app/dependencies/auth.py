"""Shared authorization dependencies.

The mock identity is intentionally available only in development and test
environments. Replace the mock branch in ``get_current_user`` with Supabase
JWT verification when authentication integration is complete; route
dependencies can remain unchanged.
"""

from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, Header
from pydantic import BaseModel

from app.core.config import settings
from app.core.exceptions import Forbidden, Unauthorized, ValidationError
from app.models.enums import UserRole


class CurrentUser(BaseModel):
    id: UUID
    email: str
    role: UserRole


def _mock_role(value: str) -> UserRole:
    try:
        return UserRole(value.upper())
    except ValueError as exc:
        valid_roles = ", ".join(role.value for role in UserRole)
        raise ValidationError(f"X-Mock-Role must be one of: {valid_roles}.") from exc


async def get_current_user(
    mock_role: str | None = Header(default=None, alias="X-Mock-Role"),
    mock_user_id: UUID | None = Header(default=None, alias="X-Mock-User-ID"),
    mock_email: str | None = Header(default=None, alias="X-Mock-Email"),
) -> CurrentUser:
    """Return the authenticated user (a mock identity until JWT verification is added)."""
    if settings.app_env.lower() not in {"development", "test", "testing"}:
        raise Unauthorized("Authentication is required.")

    if not settings.auth_mock_enabled:
        raise Unauthorized("Authentication is not configured.")

    return CurrentUser(
        id=mock_user_id or UUID("00000000-0000-0000-0000-000000000001"),
        email=mock_email or "mock-user@kncl.local",
        role=_mock_role(mock_role or settings.auth_mock_default_role),
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
