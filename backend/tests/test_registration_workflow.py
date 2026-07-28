import pytest
from fastapi.testclient import TestClient

from app.seed.data import (
    PLAYER_1_ID,
    REGISTRATION_1_ID,
    REGISTRATION_3_ID,
    SEASON_2025_ID,
    SEASON_2026_ID,
)
from tests.conftest import SEEDED_IDS


def _submit_payload(*, player_id: str, club_id: str, season_id: str) -> dict:
    return {
        "player_id": player_id,
        "club_id": club_id,
        "season_id": season_id,
    }


def _get_registration(client: TestClient, registration_id: str, headers: dict[str, str]) -> dict:
    response = client.get(f"/api/v1/registrations/{registration_id}", headers=headers)
    assert response.status_code == 200
    return response.json()


def test_submit_rejects_duplicate_player_season(
    client: TestClient,
    club_admin_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/registrations/",
        json=_submit_payload(
            player_id=str(PLAYER_1_ID),
            club_id=str(SEEDED_IDS["club"]),
            season_id=str(SEASON_2026_ID),
        ),
        headers=club_admin_headers,
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "duplicate_resource"


def test_submit_rejects_closed_season(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/registrations/",
        json=_submit_payload(
            player_id=str(PLAYER_1_ID),
            club_id=str(SEEDED_IDS["club"]),
            season_id=str(SEASON_2025_ID),
        ),
        headers=admin_headers,
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


def test_approve_pending_registration(
    client: TestClient,
    league_coord_headers: dict[str, str],
    admin_headers: dict[str, str],
) -> None:
    registration = _get_registration(client, str(REGISTRATION_3_ID), admin_headers)
    if registration["status"] != "PENDING":
        pytest.skip("Seed registration is no longer pending.")

    response = client.post(
        f"/api/v1/registrations/{REGISTRATION_3_ID}/approve",
        json={"remarks": "Approved in workflow test"},
        headers=league_coord_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "APPROVED"


def test_reject_pending_registration(
    client: TestClient,
    league_coord_headers: dict[str, str],
    admin_headers: dict[str, str],
) -> None:
    registration = _get_registration(client, str(REGISTRATION_3_ID), admin_headers)
    if registration["status"] != "PENDING":
        pytest.skip("Seed registration is no longer pending.")

    response = client.post(
        f"/api/v1/registrations/{REGISTRATION_3_ID}/reject",
        json={"remarks": "Rejected in workflow test"},
        headers=league_coord_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "REJECTED"


def test_cannot_approve_non_pending_registration(
    client: TestClient,
    league_coord_headers: dict[str, str],
) -> None:
    response = client.post(
        f"/api/v1/registrations/{REGISTRATION_1_ID}/approve",
        headers=league_coord_headers,
    )

    assert response.status_code == 400


def test_registrations_do_not_expose_patch(
    client: TestClient,
    league_coord_headers: dict[str, str],
) -> None:
    response = client.patch(
        f"/api/v1/registrations/{REGISTRATION_1_ID}",
        json={"status": "REJECTED"},
        headers=league_coord_headers,
    )

    assert response.status_code == 405
