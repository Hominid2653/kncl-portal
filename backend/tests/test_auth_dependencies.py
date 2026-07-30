import asyncio

import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import Forbidden, ValidationError
from app.dependencies.auth import (
    CurrentUser,
    require_club_admin,
    require_club_leadership,
    require_federation_admin,
    require_league_leadership,
    resolve_current_user,
)
from app.models.enums import UserRole


def test_get_current_user_returns_a_mock_user_with_the_requested_role() -> None:
    async def _run():
        from app.database.database import AsyncSessionLocal

        async with AsyncSessionLocal() as db:
            return await resolve_current_user(
                db,
                mock_role="club_admin",
            )

    user = asyncio.run(_run())

    assert user.role is UserRole.CLUB_ADMIN
    assert user.email == "mock-user@kncl.local"


def test_role_guard_returns_an_authorized_user() -> None:
    user = CurrentUser(
        id="00000000-0000-0000-0000-000000000001",
        auth_user_id="00000000-0000-0000-0000-000000000001",
        email="admin@kncl.local",
        role=UserRole.FEDERATION_ADMIN,
    )

    assert asyncio.run(require_federation_admin(user)) == user


def test_role_guard_rejects_an_unauthorized_user() -> None:
    user = CurrentUser(
        id="00000000-0000-0000-0000-000000000001",
        auth_user_id="00000000-0000-0000-0000-000000000001",
        email="player@kncl.local",
        role=UserRole.PLAYER,
    )

    with pytest.raises(Forbidden):
        asyncio.run(require_club_admin(user))


def test_leadership_tiers_include_the_appropriate_higher_roles() -> None:
    coordinator = CurrentUser(
        id="00000000-0000-0000-0000-000000000002",
        auth_user_id="00000000-0000-0000-0000-000000000002",
        email="coordinator@kncl.local",
        role=UserRole.LEAGUE_COORDINATOR,
    )
    club_admin = CurrentUser(
        id="00000000-0000-0000-0000-000000000003",
        auth_user_id="00000000-0000-0000-0000-000000000003",
        email="club-admin@kncl.local",
        role=UserRole.CLUB_ADMIN,
    )

    assert asyncio.run(require_league_leadership(coordinator)) == coordinator
    assert asyncio.run(require_club_leadership(coordinator)) == coordinator
    assert asyncio.run(require_club_leadership(club_admin)) == club_admin


def test_mock_role_must_be_valid() -> None:
    async def _run():
        from app.database.database import AsyncSessionLocal

        async with AsyncSessionLocal() as db:
            return await resolve_current_user(
                db,
                mock_role="owner",
            )

    with pytest.raises(ValidationError):
        asyncio.run(_run())
