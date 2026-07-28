import asyncio

import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import ResourceNotFound, ValidationError
from app.integrations.lichess_client import LichessClient
from app.seed.data import PLAYER_1_ID
from app.services.lichess_service import LichessService

MOCK_LICHESS_USER = {
    "id": "elias_mwangi",
    "username": "elias_mwangi",
    "title": "FM",
    "url": "https://lichess.org/@/elias_mwangi",
    "createdAt": 1_600_000_000_000,
    "perfs": {
        "bullet": {"games": 25, "rating": 1500, "rd": 80, "prog": 0},
        "blitz": {"games": 120, "rating": 1650, "rd": 65, "prog": 12},
        "rapid": {"games": 80, "rating": 1720, "rd": 70, "prog": -4},
        "classical": {"games": 15, "rating": 1600, "rd": 120, "prog": 0},
    },
    "profile": {
        "country": "KE",
        "fideRating": 1800,
    },
}


@pytest.fixture
def mock_lichess_client(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_get_user(self, username: str) -> dict:
        normalized = self.normalize_username(username)
        if normalized.lower() == "missing_user":
            raise ResourceNotFound(f"Lichess user '{normalized}' not found.")
        payload = dict(MOCK_LICHESS_USER)
        payload["username"] = normalized
        payload["id"] = normalized
        payload["url"] = f"https://lichess.org/@/{normalized}"
        return payload

    monkeypatch.setattr(LichessClient, "get_user", fake_get_user)


def test_lichess_client_rejects_invalid_username() -> None:
    client = LichessClient()
    with pytest.raises(ValidationError, match="format is invalid"):
        client.normalize_username("bad username!")


def test_lookup_user_maps_ratings(mock_lichess_client: None) -> None:
    service = LichessService()
    profile = asyncio.run(service.lookup_user("elias_mwangi"))

    assert profile.username == "elias_mwangi"
    assert profile.title == "FM"
    assert profile.country == "KE"
    assert profile.fide_rating == 1800
    assert profile.ratings.blitz == 1650
    assert profile.ratings.rapid == 1720
    assert profile.ratings.classical == 1600
    assert profile.verified is True


def test_lookup_lichess_user_endpoint(
    client: TestClient,
    player_headers: dict[str, str],
    mock_lichess_client: None,
) -> None:
    response = client.get(
        "/api/v1/integrations/lichess/users/elias_mwangi",
        headers=player_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "elias_mwangi"
    assert body["ratings"]["blitz"] == 1650
    assert body["profile_url"] == "https://lichess.org/@/elias_mwangi"


def test_lookup_lichess_user_not_found(
    client: TestClient,
    player_headers: dict[str, str],
    mock_lichess_client: None,
) -> None:
    response = client.get(
        "/api/v1/integrations/lichess/users/missing_user",
        headers=player_headers,
    )

    assert response.status_code == 404


def test_get_player_lichess_profile(
    client: TestClient,
    player_headers: dict[str, str],
    mock_lichess_client: None,
) -> None:
    response = client.get(
        f"/api/v1/players/{PLAYER_1_ID}/lichess",
        headers=player_headers,
    )

    assert response.status_code == 200
    assert response.json()["username"] == "elias_mwangi"


def test_sync_player_lichess_ratings(
    client: TestClient,
    player_headers: dict[str, str],
    mock_lichess_client: None,
) -> None:
    response = client.post(
        f"/api/v1/players/{PLAYER_1_ID}/lichess/sync",
        headers=player_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["blitz_rating"] == 1650
    assert body["rapid_rating"] == 1720
    assert body["classical_rating"] == 1600
