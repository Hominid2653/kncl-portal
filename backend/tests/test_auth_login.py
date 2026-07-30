from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def login_credentials() -> dict[str, str]:
    return {
        "username": "grace.wanjiru@kncl.local",
        "password": "test-password",
    }


def test_login_returns_bearer_token(
    client: TestClient,
    login_credentials: dict[str, str],
) -> None:
    with patch(
        "app.api.v1.endpoints.auth_login.SupabaseAuthService.login_with_password",
        new_callable=AsyncMock,
        return_value="supabase-access-token",
    ):
        response = client.post("/api/v1/auth/token", data=login_credentials)

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] == "supabase-access-token"
    assert body["token_type"] == "bearer"


def test_login_rejects_invalid_credentials(
    client: TestClient,
    login_credentials: dict[str, str],
) -> None:
    from app.core.exceptions import Unauthorized

    with patch(
        "app.api.v1.endpoints.auth_login.SupabaseAuthService.login_with_password",
        new_callable=AsyncMock,
        side_effect=Unauthorized("Invalid email or password."),
    ):
        response = client.post("/api/v1/auth/token", data=login_credentials)

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"
