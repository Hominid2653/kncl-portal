from fastapi.testclient import TestClient

from tests.conftest import SEEDED_IDS


def test_player_can_read_own_profile(client: TestClient, player_headers: dict[str, str]) -> None:
    response = client.get(
        f"/api/v1/user-profiles/{SEEDED_IDS['user_player']}",
        headers=player_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(SEEDED_IDS["user_player"])


def test_player_cannot_read_other_user_profiles(
    client: TestClient,
    player_headers: dict[str, str],
) -> None:
    response = client.get(
        f"/api/v1/user-profiles/{SEEDED_IDS['user_fed_admin']}",
        headers=player_headers,
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_player_can_read_own_player_record(client: TestClient, player_headers: dict[str, str]) -> None:
    response = client.get(
        f"/api/v1/players/{SEEDED_IDS['player']}",
        headers=player_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(SEEDED_IDS["player"])


def test_player_list_players_is_scoped_to_self(client: TestClient, player_headers: dict[str, str]) -> None:
    response = client.get("/api/v1/players/", headers=player_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == str(SEEDED_IDS["player"])


def test_club_admin_can_read_managed_club(client: TestClient, club_admin_headers: dict[str, str]) -> None:
    response = client.get(
        f"/api/v1/clubs/{SEEDED_IDS['club']}",
        headers=club_admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(SEEDED_IDS["club"])


def test_player_cannot_read_unrelated_club(client: TestClient, player_headers: dict[str, str]) -> None:
    response = client.get(
        f"/api/v1/clubs/{SEEDED_IDS['club']}",
        headers=player_headers,
    )

    assert response.status_code == 403


def test_player_cannot_access_audit_logs(client: TestClient, player_headers: dict[str, str]) -> None:
    response = client.get("/api/v1/audit-logs/", headers=player_headers)

    assert response.status_code == 403


def test_league_coordinator_can_access_audit_logs(
    client: TestClient,
    league_coord_headers: dict[str, str],
) -> None:
    response = client.get("/api/v1/audit-logs/", headers=league_coord_headers)

    assert response.status_code == 200
    assert response.json()["total"] >= 1


def test_club_admin_can_patch_own_club(client: TestClient, club_admin_headers: dict[str, str]) -> None:
    response = client.patch(
        f"/api/v1/clubs/{SEEDED_IDS['club']}",
        json={"description": "Updated by club admin during authorization tests"},
        headers=club_admin_headers,
    )

    assert response.status_code == 200


def test_player_cannot_create_league(client: TestClient, player_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/leagues/",
        json={"name": "Blocked League", "description": "Should fail"},
        headers=player_headers,
    )

    assert response.status_code == 403
