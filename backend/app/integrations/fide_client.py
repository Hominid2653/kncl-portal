import re

import httpx

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, ResourceNotFound, ValidationError
from app.integrations.external_cache import get_cached_payload, set_cached_payload

FIDE_ID_PATTERN = re.compile(r"^\d{4,10}$")


class FideClient:
    """Fetch player ratings from the public FIDE ratings profile page."""

    def __init__(self, *, base_url: str | None = None, timeout: float = 20.0) -> None:
        self.base_url = (base_url or settings.fide_ratings_base_url).rstrip("/")
        self.timeout = timeout

    def normalize_fide_id(self, fide_id: str) -> str:
        normalized = fide_id.strip()
        if not normalized:
            raise ValidationError("FIDE ID is required.")
        if not FIDE_ID_PATTERN.match(normalized):
            raise ValidationError("FIDE ID must be 4–10 digits.")
        return normalized

    async def get_player(self, fide_id: str) -> dict:
        normalized = self.normalize_fide_id(fide_id)
        cache_key = f"fide:player:{normalized}"
        cached = get_cached_payload(cache_key)
        if cached is not None:
            return cached

        url = f"{self.base_url}/profile/{normalized}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.get(
                    url,
                    headers={"User-Agent": "KNCL-Portal/1.0", "Accept": "text/html"},
                )
        except httpx.RequestError as exc:
            raise ExternalServiceError("Unable to reach FIDE ratings service.") from exc

        if response.status_code == 404:
            raise ResourceNotFound(f"FIDE player '{normalized}' not found.")
        if response.status_code != 200:
            raise ExternalServiceError("FIDE ratings service returned an unexpected response.")

        html = response.text
        if "no record found" in html.lower():
            raise ResourceNotFound(f"FIDE player '{normalized}' not found.")

        payload = self._parse_profile_html(html, normalized)
        set_cached_payload(cache_key, payload)
        return payload

    def _parse_profile_html(self, html: str, fide_id: str) -> dict:
        classical = self._rating_near_label(html, "STANDARD")
        rapid = self._rating_near_label(html, "RAPID")
        blitz = self._rating_near_label(html, "BLITZ")

        if classical is None and rapid is None and blitz is None:
            raise ExternalServiceError("Could not parse ratings from FIDE profile.")

        title_match = re.search(r"FIDE title[^<]*</[^>]+>\s*<[^>]+>\s*([^<]+)", html, re.I)
        name_match = re.search(r"<h1[^>]*>\s*([^<]+?)\s*</h1>", html, re.I)

        return {
            "fide_id": fide_id,
            "name": name_match.group(1).strip() if name_match else None,
            "title": title_match.group(1).strip() if title_match else None,
            "classical_rating": classical,
            "rapid_rating": rapid,
            "blitz_rating": blitz,
            "profile_url": f"{self.base_url}/profile/{fide_id}",
        }

    @staticmethod
    def _rating_near_label(html: str, label: str) -> int | None:
        patterns = [
            rf"(\d{{3,4}})\s*</[^>]+>\s*<[^>]+>\s*{label}\b",
            rf"(\d{{3,4}})[\s\S]{{0,40}}?{label}\b",
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.I)
            if match:
                return int(match.group(1))
        return None
