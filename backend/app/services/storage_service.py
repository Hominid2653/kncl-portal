import re
from pathlib import Path
from uuid import uuid4

import httpx

from app.core.config import settings
from app.core.exceptions import ValidationError

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".pdf", *IMAGE_EXTENSIONS}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}
EXTENSION_CONTENT_TYPES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


class StorageService:
    """Upload and download helpers for Supabase Storage."""

    def __init__(self, *, bucket: str | None = None) -> None:
        self.bucket = bucket or settings.supabase_storage_bucket
        self.base_url = settings.supabase_url.rstrip("/")
        self.service_key = settings.supabase_service_role_key

    def validate_upload(
        self,
        *,
        filename: str,
        content_type: str | None,
        size_bytes: int,
    ) -> str:
        if size_bytes <= 0:
            raise ValidationError("Uploaded file is empty.")
        if size_bytes > settings.max_upload_size_bytes:
            max_mb = settings.max_upload_size_bytes // (1024 * 1024)
            raise ValidationError(f"File exceeds the maximum upload size of {max_mb} MB.")

        extension = Path(filename).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
            raise ValidationError(f"Unsupported file type. Allowed extensions: {allowed}.")

        resolved_type = content_type or EXTENSION_CONTENT_TYPES[extension]
        if resolved_type not in ALLOWED_CONTENT_TYPES:
            raise ValidationError("Unsupported file content type.")

        return resolved_type

    def build_transfer_path(self, transfer_id: str, filename: str) -> str:
        safe_name = self._sanitize_filename(filename)
        return f"transfers/{transfer_id}/{uuid4()}_{safe_name}"

    def build_headshot_path(self, player_id: str, filename: str) -> str:
        safe_name = self._sanitize_filename(filename)
        return f"headshots/{player_id}/{uuid4()}_{safe_name}"

    def validate_image_upload(
        self,
        *,
        filename: str,
        content_type: str | None,
        size_bytes: int,
    ) -> str:
        if size_bytes <= 0:
            raise ValidationError("Uploaded file is empty.")
        if size_bytes > settings.max_upload_size_bytes:
            max_mb = settings.max_upload_size_bytes // (1024 * 1024)
            raise ValidationError(f"File exceeds the maximum upload size of {max_mb} MB.")

        extension = Path(filename).suffix.lower()
        if extension not in IMAGE_EXTENSIONS:
            allowed = ", ".join(sorted(IMAGE_EXTENSIONS))
            raise ValidationError(f"Unsupported image type. Allowed extensions: {allowed}.")

        resolved_type = content_type or EXTENSION_CONTENT_TYPES[extension]
        if resolved_type not in IMAGE_CONTENT_TYPES:
            raise ValidationError("Unsupported image content type.")

        return resolved_type

    async def resolve_public_url(self, storage_path: str | None) -> str | None:
        if not storage_path:
            return None
        if storage_path.startswith("http://") or storage_path.startswith("https://"):
            return storage_path
        return await self.create_signed_download_url(storage_path)

    async def upload(
        self,
        *,
        storage_path: str,
        content: bytes,
        content_type: str,
    ) -> str:
        url = f"{self.base_url}/storage/v1/object/{self.bucket}/{storage_path}"
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {self.service_key}",
                    "Content-Type": content_type,
                    "x-upsert": "true",
                },
                content=content,
            )
            if response.status_code >= 400:
                raise ValidationError("Failed to upload file to storage.")
        return storage_path

    async def delete(self, storage_path: str) -> None:
        if storage_path.startswith("http"):
            return

        url = f"{self.base_url}/storage/v1/object/{self.bucket}/{storage_path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.delete(
                url,
                headers={"Authorization": f"Bearer {self.service_key}"},
            )
            if response.status_code >= 400 and response.status_code != 404:
                raise ValidationError("Failed to delete file from storage.")

    async def create_signed_download_url(
        self,
        storage_path: str,
        *,
        expires_in: int = 3600,
    ) -> str:
        if storage_path.startswith("http"):
            return storage_path

        url = f"{self.base_url}/storage/v1/object/sign/{self.bucket}/{storage_path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {self.service_key}",
                    "Content-Type": "application/json",
                },
                json={"expiresIn": expires_in},
            )
            if response.status_code >= 400:
                raise ValidationError("Failed to create download URL.")

        payload = response.json()
        signed_path = payload.get("signedURL") or payload.get("signedUrl")
        if not signed_path:
            raise ValidationError("Storage did not return a signed download URL.")
        if signed_path.startswith("http"):
            return signed_path
        return f"{self.base_url}{signed_path}"

    def _sanitize_filename(self, filename: str) -> str:
        name = Path(filename).name
        sanitized = re.sub(r"[^A-Za-z0-9._-]", "_", name).strip("._")
        return sanitized or "upload.bin"
