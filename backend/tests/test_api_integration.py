import pytest
from fastapi.testclient import TestClient
from tests.conftest import LIST_ENDPOINTS, SEEDED_IDS


@pytest.mark.parametrize("path", LIST_ENDPOINTS)
def test_list_endpoints_return_seeded_collections(
    client: TestClient,
    admin_headers: dict[str, str],
    league_coord_headers: dict[str, str],
    path: str,
) -> None:
    headers = league_coord_headers if path == "/api/v1/audit-logs/" else admin_headers
    response = client.get(path, headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert isinstance(body["items"], list)
    assert body["total"] >= 1


@pytest.mark.parametrize(
    ("path", "id_key"),
    [
        ("/api/v1/leagues/{id}", "league"),
        ("/api/v1/clubs/{id}", "club"),
        ("/api/v1/players/{id}", "player"),
    ],
)
def test_get_by_id_returns_seeded_resource(
    client: TestClient,
    admin_headers: dict[str, str],
    path: str,
    id_key: str,
) -> None:
    resource_id = SEEDED_IDS[id_key]
    response = client.get(path.format(id=resource_id), headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["id"] == str(resource_id)


def test_get_by_id_returns_404_for_unknown_resource(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    response = client.get(
        "/api/v1/clubs/00000000-0000-0000-0000-000000000099",
        headers=admin_headers,
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "resource_not_found"


def test_list_supports_pagination(client: TestClient, admin_headers: dict[str, str]) -> None:
    response = client.get(
        "/api/v1/players/",
        params={"page": 1, "page_size": 2},
        headers=admin_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) <= 2
    assert body["total"] >= len(body["items"])


def test_list_supports_search(client: TestClient, admin_headers: dict[str, str]) -> None:
    response = client.get(
        "/api/v1/players/",
        params={"search": "elias"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["total"] >= 1


def test_list_supports_filter(client: TestClient, admin_headers: dict[str, str]) -> None:
    league_id = SEEDED_IDS["league"]
    response = client.get(
        "/api/v1/clubs/",
        params=[("filter", f"league_id={league_id}")],
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["total"] >= 1
    assert all(item["league_id"] == str(league_id) for item in response.json()["items"])


def test_list_public_leagues_without_authentication(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "auth_mock_enabled", False)
    response = client.get("/api/v1/leagues/public")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert body["items"][0]["name"]


def test_list_requires_authentication_when_mock_disabled(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "auth_mock_enabled", False)
    response = client.get("/api/v1/leagues/")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_create_requires_authentication_when_mock_disabled(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "auth_mock_enabled", False)
    response = client.post(
        "/api/v1/leagues/",
        json={"name": "Unauthorized League", "description": "Should fail"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_create_without_admin_role_is_rejected(client: TestClient, player_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/leagues/",
        json={"name": "Unauthorized League", "description": "Should fail"},
        headers=player_headers,
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_create_rejects_non_admin_role(client: TestClient, player_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/leagues/",
        json={"name": "Player League", "description": "Should fail"},
        headers=player_headers,
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_create_allows_federation_admin(client: TestClient, admin_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/leagues/",
        json={"name": "Integration Test League", "description": "Created during API tests"},
        headers=admin_headers,
    )

    assert response.status_code in {201, 409}


def test_transfers_do_not_expose_delete(client: TestClient, admin_headers: dict[str, str]) -> None:
    response = client.delete(
        "/api/v1/transfers/77777777-7777-4777-8777-777777777701",
        headers=admin_headers,
    )

    assert response.status_code == 405


def test_audit_logs_do_not_expose_patch(client: TestClient, admin_headers: dict[str, str]) -> None:
    response = client.patch(
        "/api/v1/audit-logs/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
        json={"action": "SHOULD_NOT_UPDATE"},
        headers=admin_headers,
    )

    assert response.status_code == 405
