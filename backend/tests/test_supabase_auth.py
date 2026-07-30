import asyncio
from uuid import uuid4

import pytest

from app.core.exceptions import Forbidden, Unauthorized
from app.core.security import create_supabase_token, decode_supabase_token
from app.dependencies.auth import resolve_current_user
from app.models.enums import UserRole
from app.seed.data import AUTH_FED_ADMIN_ID, USER_FED_ADMIN_ID


def test_decode_supabase_token_returns_subject(jwt_secret: str) -> None:
    token = create_supabase_token(
        auth_user_id=AUTH_FED_ADMIN_ID,
        email="grace.wanjiru@kncl.local",
        secret=jwt_secret,
    )

    payload = decode_supabase_token(token)

    assert payload.auth_user_id == AUTH_FED_ADMIN_ID
    assert payload.email == "grace.wanjiru@kncl.local"


def test_decode_supabase_token_rejects_invalid_token(jwt_secret: str) -> None:
    with pytest.raises(Unauthorized):
        decode_supabase_token("not-a-valid-token")


async def _get_user_from_bearer(token: str):
    from app.database.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        return await resolve_current_user(
            db,
            authorization=f"Bearer {token}",
        )


def test_get_current_user_from_bearer_token_loads_profile(jwt_secret: str) -> None:
    token = create_supabase_token(
        auth_user_id=AUTH_FED_ADMIN_ID,
        email="grace.wanjiru@kncl.local",
        secret=jwt_secret,
    )

    user = asyncio.run(_get_user_from_bearer(token))

    assert user.id == USER_FED_ADMIN_ID
    assert user.auth_user_id == AUTH_FED_ADMIN_ID
    assert user.role is UserRole.FEDERATION_ADMIN
    assert user.email == "grace.wanjiru@kncl.local"


def test_get_current_user_rejects_unknown_profile(jwt_secret: str) -> None:
    token = create_supabase_token(
        auth_user_id=uuid4(),
        email="unknown@kncl.local",
        secret=jwt_secret,
    )

    with pytest.raises(Forbidden):
        asyncio.run(_get_user_from_bearer(token))


def test_bearer_auth_endpoint_access(client, admin_bearer_headers) -> None:
    response = client.post(
        "/api/v1/leagues/",
        json={"name": "Bearer Auth League", "description": "Created with Supabase JWT"},
        headers=admin_bearer_headers,
    )

    assert response.status_code in {201, 409}
