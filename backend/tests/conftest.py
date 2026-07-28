import asyncio
import sys

import pytest
from fastapi.testclient import TestClient

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.main import app
from app.seed.data import (
    AUTH_FED_ADMIN_ID,
    AUTH_PLAYER_1_ID,
    CLUB_NAIROBI_ID,
    LEAGUE_ID,
    PLAYER_1_ID,
    USER_CLUB_ADMIN_NAIROBI_ID,
    USER_FED_ADMIN_ID,
    USER_LEAGUE_COORD_ID,
    USER_PLAYER_1_ID,
)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def admin_headers() -> dict[str, str]:
    return {
        "X-Mock-Role": "FEDERATION_ADMIN",
        "X-Mock-User-ID": str(USER_FED_ADMIN_ID),
        "X-Mock-Email": "grace.wanjiru@kncl.local",
    }


@pytest.fixture
def player_headers() -> dict[str, str]:
    return {
        "X-Mock-Role": "PLAYER",
        "X-Mock-User-ID": str(USER_PLAYER_1_ID),
        "X-Mock-Email": "elias.mwangi@kncl.local",
    }


@pytest.fixture
def league_coord_headers() -> dict[str, str]:
    return {
        "X-Mock-Role": "LEAGUE_COORDINATOR",
        "X-Mock-User-ID": str(USER_LEAGUE_COORD_ID),
        "X-Mock-Email": "peter.otieno@kncl.local",
    }


@pytest.fixture
def club_admin_headers() -> dict[str, str]:
    return {
        "X-Mock-Role": "CLUB_ADMIN",
        "X-Mock-User-ID": str(USER_CLUB_ADMIN_NAIROBI_ID),
        "X-Mock-Email": "james.kamau@kncl.local",
    }


@pytest.fixture
def jwt_secret(monkeypatch: pytest.MonkeyPatch) -> str:
    secret = "test-supabase-jwt-secret"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", secret)
    from app.core.config import get_settings, settings

    get_settings.cache_clear()
    monkeypatch.setattr(settings, "supabase_jwt_secret", secret)
    return secret


@pytest.fixture
def admin_bearer_headers(jwt_secret: str) -> dict[str, str]:
    from app.core.security import create_supabase_token

    token = create_supabase_token(
        auth_user_id=AUTH_FED_ADMIN_ID,
        email="grace.wanjiru@kncl.local",
        secret=jwt_secret,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def unknown_user_bearer_headers(jwt_secret: str) -> dict[str, str]:
    from uuid import uuid4

    from app.core.security import create_supabase_token

    token = create_supabase_token(
        auth_user_id=uuid4(),
        email="unknown@kncl.local",
        secret=jwt_secret,
    )
    return {"Authorization": f"Bearer {token}"}


SEEDED_IDS = {
    "league": LEAGUE_ID,
    "club": CLUB_NAIROBI_ID,
    "player": PLAYER_1_ID,
    "user_player": USER_PLAYER_1_ID,
    "user_fed_admin": USER_FED_ADMIN_ID,
    "auth_fed_admin": AUTH_FED_ADMIN_ID,
    "auth_player": AUTH_PLAYER_1_ID,
}

LIST_ENDPOINTS = [
    "/api/v1/leagues/",
    "/api/v1/seasons/",
    "/api/v1/clubs/",
    "/api/v1/user-profiles/",
    "/api/v1/players/",
    "/api/v1/club-members/",
    "/api/v1/registrations/",
    "/api/v1/transfers/",
    "/api/v1/transfer-approvals/",
    "/api/v1/documents/",
    "/api/v1/notifications/",
    "/api/v1/audit-logs/",
]
