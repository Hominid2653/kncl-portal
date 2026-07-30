from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


def test_get_current_session_returns_profile(
    client: TestClient,
    player_headers: dict[str, str],
) -> None:
    response = client.get("/api/v1/auth/me", headers=player_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == player_headers["X-Mock-User-ID"]
    assert body["email"] == player_headers["X-Mock-Email"]
    assert body["first_name"]
    assert body["last_name"]
    assert body["role"]


def test_password_reset_request_returns_204(client: TestClient) -> None:
    with patch(
        "app.api.v1.endpoints.auth_session.SupabaseAuthService.request_password_reset",
        new_callable=AsyncMock,
    ) as mock_reset:
        response = client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "grace.wanjiru@kncl.local"},
        )

    assert response.status_code == 204
    mock_reset.assert_awaited_once()


def test_password_reset_confirm_returns_204(client: TestClient) -> None:
    with patch(
        "app.api.v1.endpoints.auth_session.SupabaseAuthService.update_password_with_token",
        new_callable=AsyncMock,
    ) as mock_confirm:
        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            headers={"Authorization": "Bearer recovery-token"},
            json={"password": "new-password-123"},
        )

    assert response.status_code == 204
    mock_confirm.assert_awaited_once_with("recovery-token", "new-password-123")


def test_password_reset_confirm_requires_token(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"password": "new-password-123"},
    )
    assert response.status_code == 401


def test_password_change_returns_204(
    client: TestClient,
    player_headers: dict[str, str],
) -> None:
    with patch(
        "app.api.v1.endpoints.auth_session.SupabaseAuthService.change_password",
        new_callable=AsyncMock,
    ) as mock_change:
        response = client.post(
            "/api/v1/auth/password/change",
            headers=player_headers,
            json={
                "current_password": "old-password-123",
                "new_password": "new-password-456",
            },
        )

    assert response.status_code == 204
    mock_change.assert_awaited_once_with(
        player_headers["X-Mock-Email"],
        "old-password-123",
        "new-password-456",
    )


def test_password_change_rejects_matching_passwords(
    client: TestClient,
    player_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/auth/password/change",
        headers=player_headers,
        json={
            "current_password": "same-password",
            "new_password": "same-password",
        },
    )
    assert response.status_code == 422
