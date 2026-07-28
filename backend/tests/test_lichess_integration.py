import asyncio

import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import ResourceNotFound, ValidationError
from app.integrations.chesscom_client import ChessComClient
from app.integrations.external_cache import clear_external_cache
from app.integrations.lichess_client import LichessClient
from app.seed.data import PLAYER_1_ID
from app.services.chesscom_service import ChessComService
from app.services.lichess_service import LichessService

MOCK_LICHESS_USER = {
    "id": "elias_mwangi",
    "username": "elias_mwangi",
    "title": "FM",
    "url": "https://lichess.org/@/elias_mwangi",
    "createdAt": 1_600_000_000_000,
    "seenAt": 1_700_000_000_000,
    "perfs": {
        "bullet": {"games": 25, "rating": 1500, "rd": 80, "prog": 0},
        "blitz": {"games": 120, "rating": 1650, "rd": 65, "prog": 12, "prov": False},
        "rapid": {"games": 80, "rating": 1720, "rd": 70, "prog": -4},
        "classical": {"games": 15, "rating": 1600, "rd": 120, "prog": 0},
    },
    "profile": {
        "country": "KE",
        "fideRating": 1800,
        "firstName": "Elias",
        "lastName": "Mwangi",
        "bio": "KNCL player",
    },
}

MOCK_CHESSCOM_PLAYER = {
    "username": "elias_mwangi",
    "player_id": 12345,
    "title": "FM",
    "name": "Elias Mwangi",
    "country": "https://api.chess.com/pub/country/KE",
    "joined": 1_500_000_000,
    "avatar": "https://images.chesscomfiles.com/avatar.png",
}

MOCK_CHESSCOM_STATS = {
    "chess_bullet": {"last": {"rating": 1400}, "record": {"win": 5, "loss": 3, "draw": 1}},
    "chess_blitz": {"last": {"rating": 1650}, "record": {"win": 50, "loss": 40, "draw": 10}},
    "chess_rapid": {"last": {"rating": 1720}, "record": {"win": 30, "loss": 20, "draw": 5}},
    "chess_daily": {"last": {"rating": 1600}, "record": {"win": 10, "loss": 8, "draw": 2}},
}


@pytest.fixture(autouse=True)
def clear_cache() -> None:
    clear_external_cache()


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


@pytest.fixture
def mock_chesscom_client(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_get_player(self, username: str) -> dict:
        normalized = self.normalize_username(username)
        if normalized.lower() == "missing_user":
            raise ResourceNotFound("Chess.com user not found.")
        payload = dict(MOCK_CHESSCOM_PLAYER)
        payload["username"] = normalized
        payload["name"] = normalized.replace("_", " ").title()
        return payload

    async def fake_get_stats(self, username: str) -> dict:
        self.normalize_username(username)
        return dict(MOCK_CHESSCOM_STATS)

    monkeypatch.setattr(ChessComClient, "get_player", fake_get_player)
    monkeypatch.setattr(ChessComClient, "get_stats", fake_get_stats)


def test_lichess_client_rejects_invalid_username() -> None:
    client = LichessClient()
    with pytest.raises(ValidationError, match="format is invalid"):
        client.normalize_username("bad username!")


def test_lookup_user_maps_enriched_profile(mock_lichess_client: None) -> None:
    service = LichessService()
    profile = asyncio.run(service.lookup_user("elias_mwangi"))

    assert profile.username == "elias_mwangi"
    assert profile.title == "FM"
    assert profile.display_name == "Elias Mwangi"
    assert profile.country == "KE"
    assert profile.fide_rating == 1800
    assert profile.ratings.blitz == 1650
    assert profile.rating_details.blitz is not None
    assert profile.rating_details.blitz.games == 120
    assert profile.rating_details.blitz.provisional is False
    assert profile.account_created_at is not None
    assert profile.last_seen_at is not None


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
    assert body["rating_details"]["blitz"]["games"] == 120


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


def test_get_player_lichess_profile_returns_comparison(
    client: TestClient,
    player_headers: dict[str, str],
    mock_lichess_client: None,
) -> None:
    response = client.get(
        f"/api/v1/players/{PLAYER_1_ID}/lichess",
        headers=player_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["platform"] == "lichess"
    assert body["live"]["username"] == "elias_mwangi"
    assert body["matches_stored_username"] is True
    assert "drift" in body


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


def test_request_and_confirm_lichess_verification(
    client: TestClient,
    player_headers: dict[str, str],
    mock_lichess_client: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    request = client.get(
        f"/api/v1/players/{PLAYER_1_ID}/lichess/verify",
        headers=player_headers,
    )
    assert request.status_code == 200
    code = request.json()["verification_code"]

    async def fake_get_user_with_code(self, username: str) -> dict:
        payload = dict(MOCK_LICHESS_USER)
        payload["username"] = username
        payload["profile"] = {**MOCK_LICHESS_USER["profile"], "bio": f"Player {code}"}
        return payload

    monkeypatch.setattr(LichessClient, "get_user", fake_get_user_with_code)

    confirm = client.post(
        f"/api/v1/players/{PLAYER_1_ID}/lichess/verify",
        headers=player_headers,
    )
    assert confirm.status_code == 200
    assert confirm.json()["verified"] is True
    assert confirm.json()["method"] == "bio_code"


def test_admin_verify_lichess(
    client: TestClient,
    admin_headers: dict[str, str],
    mock_lichess_client: None,
) -> None:
    response = client.post(
        f"/api/v1/players/{PLAYER_1_ID}/lichess/verify/admin",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["method"] == "admin_attestation"


def test_patch_rejects_invalid_lichess_username(
    client: TestClient,
    club_admin_headers: dict[str, str],
    mock_lichess_client: None,
) -> None:
    response = client.patch(
        f"/api/v1/players/{PLAYER_1_ID}",
        headers=club_admin_headers,
        params={"sync_lichess": "true"},
        json={"lichess_username": "missing_user"},
    )

    assert response.status_code == 404


def test_lookup_chesscom_user_endpoint(
    client: TestClient,
    player_headers: dict[str, str],
    mock_chesscom_client: None,
) -> None:
    response = client.get(
        "/api/v1/integrations/chesscom/users/elias_mwangi",
        headers=player_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "elias_mwangi"
    assert body["ratings"]["blitz"] == 1650
    assert body["country"] == "KE"


def test_get_player_chesscom_profile(
    client: TestClient,
    player_headers: dict[str, str],
    mock_chesscom_client: None,
) -> None:
    response = client.get(
        f"/api/v1/players/{PLAYER_1_ID}/chesscom",
        headers=player_headers,
    )

    assert response.status_code == 200
    assert response.json()["platform"] == "chesscom"


def test_confirm_chesscom_verification_by_name(
    client: TestClient,
    player_headers: dict[str, str],
    mock_chesscom_client: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.services.chesscom_service.names_match",
        lambda *_args, **_kwargs: True,
    )
    response = client.post(
        f"/api/v1/players/{PLAYER_1_ID}/chesscom/verify",
        headers=player_headers,
    )

    assert response.status_code == 200, response.json()
    assert response.json()["method"] == "display_name_match"


def test_admin_verify_chesscom(
    client: TestClient,
    admin_headers: dict[str, str],
    mock_chesscom_client: None,
) -> None:
    response = client.post(
        f"/api/v1/players/{PLAYER_1_ID}/chesscom/verify/admin",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["method"] == "admin_attestation"
