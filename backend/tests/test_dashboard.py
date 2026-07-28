from fastapi.testclient import TestClient


def test_admin_dashboard_returns_summary(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    response = client.get("/api/v1/dashboard/admin", headers=admin_headers)

    assert response.status_code == 200
    body = response.json()
    assert "totals" in body
    assert "transfer_counts" in body
    assert "pending_by_club" in body
    assert "registrations_by_season" in body
    assert "recent_activity" in body
    assert body["totals"]["clubs"] >= 1
    assert body["totals"]["players"] >= 1


def test_league_coordinator_can_access_admin_dashboard(
    client: TestClient,
    league_coord_headers: dict[str, str],
) -> None:
    response = client.get("/api/v1/dashboard/admin", headers=league_coord_headers)

    assert response.status_code == 200


def test_player_cannot_access_admin_dashboard(
    client: TestClient,
    player_headers: dict[str, str],
) -> None:
    response = client.get("/api/v1/dashboard/admin", headers=player_headers)

    assert response.status_code == 403


def test_club_dashboard_returns_managed_clubs(
    client: TestClient,
    club_admin_headers: dict[str, str],
) -> None:
    response = client.get("/api/v1/dashboard/club", headers=club_admin_headers)

    assert response.status_code == 200
    body = response.json()
    assert "clubs" in body
    assert "recent_activity" in body
    assert "unread_notifications" in body
    assert len(body["clubs"]) >= 1


def test_player_dashboard_returns_player_scope(
    client: TestClient,
    player_headers: dict[str, str],
) -> None:
    response = client.get("/api/v1/dashboard/player", headers=player_headers)

    assert response.status_code == 200
    body = response.json()
    assert "registrations" in body
    assert "transfers" in body
    assert "transfer_counts" in body
    assert "recent_activity" in body
    assert len(body["registrations"]) >= 1


def test_player_cannot_access_club_dashboard(
    client: TestClient,
    player_headers: dict[str, str],
) -> None:
    response = client.get("/api/v1/dashboard/club", headers=player_headers)

    assert response.status_code == 403


def test_dashboard_requires_authentication(
    client: TestClient,
    monkeypatch,
) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "auth_mock_enabled", False)
    response = client.get("/api/v1/dashboard/player")

    assert response.status_code == 401
