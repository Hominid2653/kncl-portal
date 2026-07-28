import io

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.exceptions import ValidationError
from app.seed.data import DOCUMENT_1_ID, TRANSFER_PENDING_ID
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


def test_validate_upload_rejects_large_file() -> None:
    storage = StorageService()
    with pytest.raises(ValidationError, match="maximum upload size"):
        storage.validate_upload(
            filename="release.pdf",
            content_type="application/pdf",
            size_bytes=settings.max_upload_size_bytes + 1,
        )


def test_validate_upload_rejects_unsupported_extension() -> None:
    storage = StorageService()
    with pytest.raises(ValidationError, match="Unsupported file type"):
        storage.validate_upload(
            filename="script.exe",
            content_type="application/octet-stream",
            size_bytes=100,
        )


def test_upload_document_creates_record(
    client: TestClient,
    club_admin_mombasa_headers: dict[str, str],
    mock_storage: None,
) -> None:
    response = client.post(
        "/api/v1/documents/upload",
        headers=club_admin_mombasa_headers,
        data={
            "transfer_id": str(TRANSFER_PENDING_ID),
            "document_type": "release_letter",
        },
        files={"file": ("release.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["transfer_id"] == str(TRANSFER_PENDING_ID)
    assert body["document_type"] == "release_letter"
    assert body["file_name"] == "release.pdf"
    assert body["file_url"].startswith("transfers/")
    assert body["download_url"].startswith("https://signed.example/")


def test_upload_rejects_invalid_file_type(
    client: TestClient,
    club_admin_mombasa_headers: dict[str, str],
    mock_storage: None,
) -> None:
    response = client.post(
        "/api/v1/documents/upload",
        headers=club_admin_mombasa_headers,
        data={"transfer_id": str(TRANSFER_PENDING_ID)},
        files={"file": ("malware.exe", io.BytesIO(b"bad"), "application/octet-stream")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


def test_upload_requires_authenticated_club_leadership(
    client: TestClient,
    player_headers: dict[str, str],
    mock_storage: None,
) -> None:
    response = client.post(
        "/api/v1/documents/upload",
        headers=player_headers,
        data={"transfer_id": str(TRANSFER_PENDING_ID)},
        files={"file": ("release.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")},
    )

    assert response.status_code == 403


def test_get_download_url_for_document(
    client: TestClient,
    admin_headers: dict[str, str],
    mock_storage: None,
) -> None:
    response = client.get(
        f"/api/v1/documents/{DOCUMENT_1_ID}/download-url",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["download_url"].startswith("https://")
