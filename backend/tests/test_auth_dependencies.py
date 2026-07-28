import asyncio

import pytest

from app.core.exceptions import Forbidden, ValidationError
from app.dependencies.auth import (
    CurrentUser,
    get_current_user,
    require_club_admin,
    require_federation_admin,
)
from app.models.enums import UserRole


def test_get_current_user_returns_a_mock_user_with_the_requested_role() -> None:
    user = asyncio.run(
        get_current_user(mock_role="club_admin", mock_user_id=None, mock_email=None)
    )

    assert user.role is UserRole.CLUB_ADMIN
    assert user.email == "mock-user@kncl.local"


def test_role_guard_returns_an_authorized_user() -> None:
    user = CurrentUser(
        id="00000000-0000-0000-0000-000000000001",
        email="admin@kncl.local",
        role=UserRole.FEDERATION_ADMIN,
    )

    assert asyncio.run(require_federation_admin(user)) == user


def test_role_guard_rejects_an_unauthorized_user() -> None:
    user = CurrentUser(
        id="00000000-0000-0000-0000-000000000001",
        email="player@kncl.local",
        role=UserRole.PLAYER,
    )

    with pytest.raises(Forbidden):
        asyncio.run(require_club_admin(user))


def test_mock_role_must_be_valid() -> None:
    with pytest.raises(ValidationError):
        asyncio.run(get_current_user(mock_role="owner", mock_user_id=None, mock_email=None))
