from fastapi.testclient import TestClient

from app.seed.data import (
    CLUB_MOMBASA_ID,
    CLUB_NAIROBI_ID,
    PLAYER_3_ID,
    REGISTRATION_1_ID,
    SEASON_2026_ID,
)


def test_public_player_listings(client: TestClient) -> None:
    response = client.get("/api/v1/players/listings")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert "commitment_status" in payload["items"][0]


def test_roster_enrollment_alias_lists_registrations(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    response = client.get("/api/v1/roster-enrollments/", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1


def test_double_registration_review_returns_409(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    approve = client.post(
        f"/api/v1/roster-enrollments/{REGISTRATION_1_ID}/approve",
        headers=admin_headers,
    )
    assert approve.status_code in {200, 409}
    if approve.status_code == 200:
        duplicate = client.post(
            f"/api/v1/roster-enrollments/{REGISTRATION_1_ID}/approve",
            headers=admin_headers,
        )
        assert duplicate.status_code == 409


def test_player_transfer_request_requires_player(
    client: TestClient,
    club_admin_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/transfers/player-request",
        headers=club_admin_headers,
        json={
            "from_club_id": str(CLUB_NAIROBI_ID),
            "to_club_id": str(CLUB_MOMBASA_ID),
            "reason": "Seeking new challenge",
        },
    )
    assert response.status_code == 403


def test_create_engagement_as_club_admin(
    client: TestClient,
    club_admin_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/engagements/",
        headers=club_admin_headers,
        json={
            "player_id": str(PLAYER_3_ID),
            "message": "We would love to have you on our roster.",
        },
    )
    assert response.status_code in {201, 409}
    if response.status_code == 201:
        assert response.json()["status"] == "PENDING"


def test_coordinator_can_patch_season_windows(
    client: TestClient,
    league_coord_headers: dict[str, str],
) -> None:
    response = client.patch(
        f"/api/v1/seasons/{SEASON_2026_ID}",
        headers=league_coord_headers,
        json={"transfers_open": True},
    )
    assert response.status_code == 200
