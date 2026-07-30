import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.models.enums import OtpPurpose
from app.services.otp_service import OtpService


@pytest.fixture
def otp_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "email_verification_jwt_secret", "test-email-verification-secret")
    monkeypatch.setattr(settings, "secret_key", "test-secret-key")


@pytest.fixture
def fixed_otp_code(monkeypatch: pytest.MonkeyPatch) -> str:
    code = "482913"
    monkeypatch.setattr(OtpService, "_generate_code", lambda self: code)
    return code


def test_request_and_verify_otp_returns_token(
    client: TestClient,
    otp_settings: None,
    fixed_otp_code: str,
) -> None:
    email = "applicant@example.com"

    request_response = client.post(
        "/api/v1/auth/otp/request",
        json={"email": email, "purpose": OtpPurpose.APPLICATION_SUBMIT.value},
    )
    assert request_response.status_code == 204

    verify_response = client.post(
        "/api/v1/auth/otp/verify",
        json={
            "email": email,
            "code": fixed_otp_code,
            "purpose": OtpPurpose.APPLICATION_SUBMIT.value,
        },
    )
    assert verify_response.status_code == 200
    body = verify_response.json()
    assert "email_verification_token" in body
    assert body["expires_in"] == settings.email_verification_jwt_expiry_seconds


def test_verify_otp_rejects_invalid_code(
    client: TestClient,
    otp_settings: None,
    fixed_otp_code: str,
) -> None:
    email = "wrong-code@example.com"
    client.post(
        "/api/v1/auth/otp/request",
        json={"email": email, "purpose": OtpPurpose.STATUS_LOOKUP.value},
    )

    response = client.post(
        "/api/v1/auth/otp/verify",
        json={
            "email": email,
            "code": "000000",
            "purpose": OtpPurpose.STATUS_LOOKUP.value,
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


def test_application_status_requires_status_lookup_token(
    client: TestClient,
    otp_settings: None,
    fixed_otp_code: str,
) -> None:
    email = "status@example.com"
    client.post(
        "/api/v1/auth/otp/request",
        json={"email": email, "purpose": OtpPurpose.STATUS_LOOKUP.value},
    )
    verify_response = client.post(
        "/api/v1/auth/otp/verify",
        json={
            "email": email,
            "code": fixed_otp_code,
            "purpose": OtpPurpose.STATUS_LOOKUP.value,
        },
    )
    token = verify_response.json()["email_verification_token"]

    status_response = client.get(
        "/api/v1/application-status",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert status_response.status_code == 200
    body = status_response.json()
    assert body["email"] == email
    assert body["club_application"] is None
    assert body["player_application"] is None


def test_application_status_rejects_application_submit_token(
    client: TestClient,
    otp_settings: None,
    fixed_otp_code: str,
) -> None:
    email = "submit-only@example.com"
    client.post(
        "/api/v1/auth/otp/request",
        json={"email": email, "purpose": OtpPurpose.APPLICATION_SUBMIT.value},
    )
    verify_response = client.post(
        "/api/v1/auth/otp/verify",
        json={
            "email": email,
            "code": fixed_otp_code,
            "purpose": OtpPurpose.APPLICATION_SUBMIT.value,
        },
    )
    token = verify_response.json()["email_verification_token"]

    status_response = client.get(
        "/api/v1/application-status",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert status_response.status_code == 401
    assert status_response.json()["error"]["code"] == "unauthorized"
