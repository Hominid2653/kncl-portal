import re

import httpx

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, ResourceNotFound, ValidationError
from app.integrations.external_cache import get_cached_payload, set_cached_payload

CHESSCOM_USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_-]{2,24}$")


class ChessComClient:
    """Low-level HTTP client for the public Chess.com API."""

    def __init__(self, *, base_url: str | None = None, timeout: float = 15.0) -> None:
        self.base_url = (base_url or settings.chesscom_base_url).rstrip("/")
        self.timeout = timeout

    def normalize_username(self, username: str) -> str:
        normalized = username.strip()
        if not normalized:
            raise ValidationError("Chess.com username is required.")
        if not CHESSCOM_USERNAME_PATTERN.match(normalized):
            raise ValidationError("Chess.com username format is invalid.")
        return normalized

    async def _get_json(self, path: str) -> dict:
        url = f"{self.base_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers={"Accept": "application/json"})
        except httpx.RequestError as exc:
            raise ExternalServiceError("Unable to reach Chess.com API.") from exc

        if response.status_code == 404:
            raise ResourceNotFound("Chess.com user not found.")
        if response.status_code != 200:
            raise ExternalServiceError("Chess.com API returned an unexpected response.")

        payload = response.json()
        if not isinstance(payload, dict):
            raise ExternalServiceError("Chess.com API returned an invalid payload.")
        return payload

    async def get_player(self, username: str) -> dict:
        normalized = self.normalize_username(username)
        cache_key = f"chesscom:player:{normalized.lower()}"
        cached = get_cached_payload(cache_key)
        if cached is not None:
            return cached

        payload = await self._get_json(f"/pub/player/{normalized}")
        if not payload.get("username"):
            raise ExternalServiceError("Chess.com API returned an invalid user payload.")
        set_cached_payload(cache_key, payload)
        return payload

    async def get_stats(self, username: str) -> dict:
        normalized = self.normalize_username(username)
        cache_key = f"chesscom:stats:{normalized.lower()}"
        cached = get_cached_payload(cache_key)
        if cached is not None:
            return cached

        try:
            payload = await self._get_json(f"/pub/player/{normalized}/stats")
        except ResourceNotFound:
            return {}
        set_cached_payload(cache_key, payload)
        return payload
