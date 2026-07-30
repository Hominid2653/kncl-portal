import io

import pytest
from fastapi.testclient import TestClient

from app.seed.data import PLAYER_1_ID
from app.services.storage_service import StorageService


@pytest.fixture
def mock_storage(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_upload(self, *, storage_path, content, content_type):
        return storage_path

    async def fake_signed(self, storage_path, *, expires_in=3600):
        return f"https://signed.example/{storage_path}"

    async def fake_delete(self, storage_path):
        return None

    monkeypatch.setattr(StorageService, "upload", fake_upload)
    monkeypatch.setattr(StorageService, "create_signed_download_url", fake_signed)
    monkeypatch.setattr(StorageService, "delete", fake_delete)


def test_upload_player_headshot(
    client: TestClient,
    player_headers: dict[str, str],
    mock_storage: None,
) -> None:
    response = client.post(
        f"/api/v1/players/{PLAYER_1_ID}/headshot/upload",
        headers=player_headers,
        files={"file": ("headshot.png", io.BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["player_id"] == str(PLAYER_1_ID)
    assert body["headshot_moderation_status"] == "PENDING"
    assert body["headshot_url"].startswith("https://signed.example/headshots/")


def test_patch_headshot_rejects_data_url(
    client: TestClient,
    player_headers: dict[str, str],
) -> None:
    response = client.patch(
        f"/api/v1/players/{PLAYER_1_ID}/headshot",
        headers=player_headers,
        json={
            "headshot_url": "data:image/png;base64,iVBORw0KGgo=",
            "headshot_source": "UPLOAD",
        },
    )
    assert response.status_code == 422


def test_list_pending_headshots(
    client: TestClient,
    player_headers: dict[str, str],
    league_coord_headers: dict[str, str],
    mock_storage: None,
) -> None:
    upload = client.post(
        f"/api/v1/players/{PLAYER_1_ID}/headshot/upload",
        headers=player_headers,
        files={"file": ("headshot.png", io.BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")},
    )
    assert upload.status_code == 201

    response = client.get("/api/v1/players/headshots/pending", headers=league_coord_headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total"] >= 1
    assert any(item["player_id"] == str(PLAYER_1_ID) for item in body["items"])
    assert body["items"][0]["headshot_url"].startswith("https://signed.example/")
