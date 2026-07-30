from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.models.enums import ApplicationStatus, OtpPurpose
from app.seed.data import CLUB_KISUMU_ID, LEAGUE_ID, USER_CLUB_ADMIN_MOMBASA_ID
from app.services.email_verification_token import create_email_verification_token
from app.seed.data import AUTH_CLUB_ADMIN_MOMBASA_ID


@pytest.fixture(autouse=True)
def application_auth_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "email_verification_jwt_secret", "test-email-verification-secret")
    monkeypatch.setattr(settings, "secret_key", "test-secret-key")

def test_submit_club_application_requires_verification_token(client: TestClient) -> None:
    response = client.post(
        "/api/v1/club-applications/",
        json={
            "club_name": "Test Falcons",
            "county": "Nairobi",
            "league_id": str(LEAGUE_ID),
            "captain_first_name": "Test",
            "captain_last_name": "Captain",
            "captain_email": "new.captain@example.com",
            "captain_phone": "+254700000099",
        },
    )
    assert response.status_code == 401


def test_submit_and_review_club_application(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    captain_email = f"captain.{uuid4().hex[:8]}@example.com"
    submit_token, _ = create_email_verification_token(
        email=captain_email,
        purpose=OtpPurpose.APPLICATION_SUBMIT,
    )
    submit_response = client.post(
        "/api/v1/club-applications/",
        headers={"Authorization": f"Bearer {submit_token}"},
        json={
            "club_name": "Test Falcons",
            "county": "Nairobi",
            "league_id": str(LEAGUE_ID),
            "captain_first_name": "Test",
            "captain_last_name": "Captain",
            "captain_email": captain_email,
            "captain_phone": "+254700000099",
        },
    )
    assert submit_response.status_code == 201
    application_id = submit_response.json()["id"]
    assert submit_response.json()["status"] == "PENDING"

    duplicate = client.post(
        "/api/v1/club-applications/",
        headers={"Authorization": f"Bearer {submit_token}"},
        json={
            "club_name": "Another Name",
            "county": "Nairobi",
            "league_id": str(LEAGUE_ID),
            "captain_first_name": "Test",
            "captain_last_name": "Captain",
            "captain_email": captain_email,
            "captain_phone": "+254700000099",
        },
    )
    assert duplicate.status_code == 409

    with patch(
        "app.services.application_service.ProvisioningService.provision_captain",
        new_callable=AsyncMock,
        return_value={
            "auth_user_id": AUTH_CLUB_ADMIN_MOMBASA_ID,
            "user_profile_id": USER_CLUB_ADMIN_MOMBASA_ID,
            "club_id": CLUB_KISUMU_ID,
        },
    ):
        approve_response = client.patch(
            f"/api/v1/club-applications/{application_id}",
            headers=admin_headers,
            json={"status": "APPROVED"},
        )
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "APPROVED"
    assert approve_response.json()["created_club_id"] is not None

    double_review = client.patch(
        f"/api/v1/club-applications/{application_id}",
        headers=admin_headers,
        json={"status": "REJECTED", "rejection_reason": "Too late"},
    )
    assert double_review.status_code == 409


def test_submit_and_reject_player_application(
    client: TestClient,
    league_coord_headers: dict[str, str],
) -> None:
    player_email = f"player.{uuid4().hex[:8]}@example.com"
    player_submit_token, _ = create_email_verification_token(
        email=player_email,
        purpose=OtpPurpose.APPLICATION_SUBMIT,
    )
    submit_response = client.post(
        "/api/v1/player-applications/",
        headers={"Authorization": f"Bearer {player_submit_token}"},
        json={
            "first_name": "Faith",
            "last_name": "Njeri",
            "email": player_email,
            "county": "Nairobi",
            "nationality": "Kenyan",
        },
    )
    assert submit_response.status_code == 201
    application_id = submit_response.json()["id"]

    reject_response = client.patch(
        f"/api/v1/player-applications/{application_id}",
        headers=league_coord_headers,
        json={"status": "REJECTED", "rejection_reason": "Incomplete information"},
    )
    assert reject_response.status_code == 200
    assert reject_response.json()["status"] == "REJECTED"
    assert reject_response.json()["rejection_reason"] == "Incomplete information"


def test_list_club_applications_as_federation_admin(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    list_token, _ = create_email_verification_token(
        email="listed.captain@example.com",
        purpose=OtpPurpose.APPLICATION_SUBMIT,
    )
    client.post(
        "/api/v1/club-applications/",
        headers={"Authorization": f"Bearer {list_token}"},
        json={
            "club_name": "Listed Club",
            "county": "Mombasa",
            "league_id": str(LEAGUE_ID),
            "captain_first_name": "List",
            "captain_last_name": "Test",
            "captain_email": "listed.captain@example.com",
            "captain_phone": "+254700000088",
        },
    )

    response = client.get("/api/v1/club-applications/", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert any(item["club_name"] == "Listed Club" for item in body["items"])


def test_create_coordinator_requires_federation_admin(
    client: TestClient,
    player_headers: dict[str, str],
    admin_headers: dict[str, str],
) -> None:
    denied = client.post(
        "/api/v1/users/coordinators",
        headers=player_headers,
        json={
            "first_name": "Coord",
            "last_name": "Denied",
            "email": "denied.coord@example.com",
            "league_ids": [str(LEAGUE_ID)],
        },
    )
    assert denied.status_code == 403

    with patch(
        "app.services.provisioning_service.ProvisioningService._create_or_get_auth_user_id",
        new_callable=AsyncMock,
        return_value=uuid4(),
    ):
        allowed = client.post(
            "/api/v1/users/coordinators",
            headers=admin_headers,
            json={
                "first_name": "New",
                "last_name": "Coordinator",
                "email": "new.coord@example.com",
                "league_ids": [str(LEAGUE_ID)],
            },
        )
    assert allowed.status_code == 201
    assert allowed.json()["role"] == "LEAGUE_COORDINATOR"
    assert allowed.json()["coordinator_league_ids"] == [str(LEAGUE_ID)]
