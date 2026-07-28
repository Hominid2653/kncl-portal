import re

import httpx

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, ResourceNotFound, ValidationError

LICHESS_USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_-]{0,19}$")


class LichessClient:
    """Low-level HTTP client for the public Lichess API."""

    def __init__(self, *, base_url: str | None = None, timeout: float = 15.0) -> None:
        self.base_url = (base_url or settings.lichess_base_url).rstrip("/")
        self.timeout = timeout

    def normalize_username(self, username: str) -> str:
        normalized = username.strip()
        if not normalized:
            raise ValidationError("Lichess username is required.")
        if not LICHESS_USERNAME_PATTERN.match(normalized):
            raise ValidationError("Lichess username format is invalid.")
        return normalized

    async def get_user(self, username: str) -> dict:
        normalized = self.normalize_username(username)
        url = f"{self.base_url}/api/user/{normalized}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    url,
                    headers={"Accept": "application/json"},
                )
        except httpx.RequestError as exc:
            raise ExternalServiceError("Unable to reach Lichess API.") from exc

        if response.status_code == 404:
            raise ResourceNotFound(f"Lichess user '{normalized}' not found.")
        if response.status_code != 200:
            raise ExternalServiceError("Lichess API returned an unexpected response.")

        payload = response.json()
        if not payload.get("username"):
            raise ExternalServiceError("Lichess API returned an invalid user payload.")
        return payload
