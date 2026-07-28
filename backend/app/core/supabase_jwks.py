import time

import httpx

from app.core.config import settings

_jwks_cache: dict | None = None
_jwks_cached_at: float = 0.0
JWKS_CACHE_TTL_SECONDS = 3600


def get_supabase_jwks(*, force_refresh: bool = False) -> dict:
    """Fetch and cache Supabase JWKS for asymmetric JWT verification."""
    global _jwks_cache, _jwks_cached_at

    now = time.time()
    if (
        not force_refresh
        and _jwks_cache is not None
        and (now - _jwks_cached_at) < JWKS_CACHE_TTL_SECONDS
    ):
        return _jwks_cache

    if not settings.supabase_url:
        raise ValueError("SUPABASE_URL is required for JWKS verification.")

    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    response = httpx.get(url, timeout=15)
    response.raise_for_status()
    payload = response.json()
    if "keys" not in payload:
        raise ValueError("Supabase JWKS response did not include keys.")

    _jwks_cache = payload
    _jwks_cached_at = now
    return payload


def clear_jwks_cache() -> None:
    global _jwks_cache, _jwks_cached_at
    _jwks_cache = None
    _jwks_cached_at = 0.0
