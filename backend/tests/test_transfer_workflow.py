from fastapi.testclient import TestClient

from app.seed.data import CLUB_KISUMU_ID, REGISTRATION_2_ID, TRANSFER_APPROVED_ID
from tests.conftest import SEEDED_IDS


def _submit_payload(
    *,
    registration_id: str,
    from_club_id: str,
    to_club_id: str,
    reason: str,
) -> dict:
    return {
        "registration_id": registration_id,
        "from_club_id": from_club_id,
        "to_club_id": to_club_id,
        "reason": reason,
    }


def _get_registration(client: TestClient, registration_id: str, headers: dict[str, str]) -> dict:
    response = client.get(f"/api/v1/registrations/{registration_id}", headers=headers)
    assert response.status_code == 200
    return response.json()


def _find_pending_transfer(
    client: TestClient,
    registration_id: str,
    headers: dict[str, str],
) -> dict | None:
    response = client.get(
        "/api/v1/transfers/",
        headers=headers,
        params=[
            ("filter", f"registration_id={registration_id}"),
            ("filter", "status=PENDING"),
        ],
    )
    assert response.status_code == 200
    items = response.json()["items"]
    return items[0] if items else None


def _create_pending_transfer(
    client: TestClient,
    *,
    registration_id: str,
    from_club_id: str,
    to_club_id: str,
    headers: dict[str, str],
    reason: str,
) -> dict:
    response = client.post(
        "/api/v1/transfers/",
        json=_submit_payload(
            registration_id=registration_id,
            from_club_id=from_club_id,
            to_club_id=to_club_id,
            reason=reason,
        ),
        headers=headers,
    )
    if response.status_code == 409:
        pending = _find_pending_transfer(client, registration_id, headers)
        assert pending is not None
        return pending

    assert response.status_code == 201
    return response.json()


def test_submit_transfer_creates_pending_transfer(
    client: TestClient,
    club_admin_headers: dict[str, str],
    admin_headers: dict[str, str],
) -> None:
    registration = _get_registration(client, str(REGISTRATION_2_ID), admin_headers)
    transfer = _create_pending_transfer(
        client,
        registration_id=str(REGISTRATION_2_ID),
        from_club_id=registration["club_id"],
        to_club_id=str(SEEDED_IDS["club_mombasa"]),
        headers=club_admin_headers,
        reason="Integration test submit transfer",
    )

    assert transfer["status"] == "PENDING"
    assert transfer["completed_at"] is None
    assert transfer["submitted_at"] is not None


def test_submit_rejects_same_club(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    registration = _get_registration(client, str(SEEDED_IDS["registration_1"]), admin_headers)
    response = client.post(
        "/api/v1/transfers/",
        json=_submit_payload(
            registration_id=str(SEEDED_IDS["registration_1"]),
            from_club_id=registration["club_id"],
            to_club_id=registration["club_id"],
            reason="Same club should fail",
        ),
        headers=admin_headers,
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


def test_submit_rejects_wrong_from_club(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    registration = _get_registration(client, str(SEEDED_IDS["registration_1"]), admin_headers)
    wrong_club = (
        str(SEEDED_IDS["club_mombasa"])
        if registration["club_id"] != str(SEEDED_IDS["club_mombasa"])
        else str(SEEDED_IDS["club"])
    )
    response = client.post(
        "/api/v1/transfers/",
        json=_submit_payload(
            registration_id=str(SEEDED_IDS["registration_1"]),
            from_club_id=wrong_club,
            to_club_id=str(CLUB_KISUMU_ID),
            reason="Wrong from club should fail",
        ),
        headers=admin_headers,
    )

    assert response.status_code == 400


def test_submit_rejects_duplicate_pending_transfer(
    client: TestClient,
    club_admin_headers: dict[str, str],
    admin_headers: dict[str, str],
) -> None:
    registration = _get_registration(client, str(REGISTRATION_2_ID), admin_headers)
    payload = _submit_payload(
        registration_id=str(REGISTRATION_2_ID),
        from_club_id=registration["club_id"],
        to_club_id=str(SEEDED_IDS["club_mombasa"]),
        reason="Duplicate pending transfer test",
    )
    first = client.post("/api/v1/transfers/", json=payload, headers=club_admin_headers)
    if first.status_code == 409:
        second = client.post("/api/v1/transfers/", json=payload, headers=club_admin_headers)
        assert second.status_code == 409
        return

    assert first.status_code == 201
    second = client.post("/api/v1/transfers/", json=payload, headers=club_admin_headers)
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "duplicate_resource"


def test_approve_transfer_updates_registration(
    client: TestClient,
    league_coord_headers: dict[str, str],
    admin_headers: dict[str, str],
) -> None:
    registration = _get_registration(client, str(SEEDED_IDS["registration_1"]), admin_headers)
    to_club_id = (
        str(SEEDED_IDS["club_mombasa"])
        if registration["club_id"] != str(SEEDED_IDS["club_mombasa"])
        else str(CLUB_KISUMU_ID)
    )
    transfer = _create_pending_transfer(
        client,
        registration_id=str(SEEDED_IDS["registration_1"]),
        from_club_id=registration["club_id"],
        to_club_id=to_club_id,
        headers=admin_headers,
        reason="Approve workflow test",
    )

    approve = client.post(
        f"/api/v1/transfers/{transfer['id']}/approve",
        json={"remarks": "Approved in workflow test"},
        headers=league_coord_headers,
    )
    assert approve.status_code == 200
    approved = approve.json()
    assert approved["status"] == "APPROVED"
    assert approved["completed_at"] is not None

    updated_registration = _get_registration(
        client,
        str(SEEDED_IDS["registration_1"]),
        admin_headers,
    )
    assert updated_registration["club_id"] == transfer["to_club_id"]


def test_reject_transfer(
    client: TestClient,
    club_admin_headers: dict[str, str],
    league_coord_headers: dict[str, str],
    admin_headers: dict[str, str],
) -> None:
    registration = _get_registration(client, str(REGISTRATION_2_ID), admin_headers)
    transfer = _create_pending_transfer(
        client,
        registration_id=str(REGISTRATION_2_ID),
        from_club_id=registration["club_id"],
        to_club_id=str(SEEDED_IDS["club_mombasa"]),
        headers=club_admin_headers,
        reason="Reject workflow test",
    )

    reject = client.post(
        f"/api/v1/transfers/{transfer['id']}/reject",
        json={"remarks": "Rejected in workflow test"},
        headers=league_coord_headers,
    )
    assert reject.status_code == 200
    assert reject.json()["status"] == "REJECTED"
    assert reject.json()["completed_at"] is not None


def test_cancel_pending_transfer(
    client: TestClient,
    club_admin_headers: dict[str, str],
    admin_headers: dict[str, str],
) -> None:
    registration = _get_registration(client, str(REGISTRATION_2_ID), admin_headers)
    transfer = _create_pending_transfer(
        client,
        registration_id=str(REGISTRATION_2_ID),
        from_club_id=registration["club_id"],
        to_club_id=str(SEEDED_IDS["club_mombasa"]),
        headers=club_admin_headers,
        reason="Cancel workflow test",
    )

    cancel = client.post(
        f"/api/v1/transfers/{transfer['id']}/cancel",
        headers=club_admin_headers,
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "CANCELLED"


def test_cannot_approve_non_pending_transfer(
    client: TestClient,
    league_coord_headers: dict[str, str],
) -> None:
    response = client.post(
        f"/api/v1/transfers/{TRANSFER_APPROVED_ID}/approve",
        headers=league_coord_headers,
    )

    assert response.status_code == 409


def test_cannot_patch_terminal_transfer(
    client: TestClient,
    club_admin_headers: dict[str, str],
) -> None:
    response = client.patch(
        f"/api/v1/transfers/{TRANSFER_APPROVED_ID}",
        json={"reason": "Should not update"},
        headers=club_admin_headers,
    )

    assert response.status_code == 400
