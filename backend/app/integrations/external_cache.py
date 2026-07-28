import time
from threading import Lock

from app.core.config import settings

_lock = Lock()
_cache: dict[str, tuple[float, dict]] = {}


def get_cached_payload(cache_key: str) -> dict | None:
    ttl = settings.external_api_cache_ttl_seconds
    now = time.time()
    with _lock:
        entry = _cache.get(cache_key)
        if not entry:
            return None
        cached_at, payload = entry
        if now - cached_at >= ttl:
            _cache.pop(cache_key, None)
            return None
        return payload


def set_cached_payload(cache_key: str, payload: dict) -> None:
    with _lock:
        _cache[cache_key] = (time.time(), payload)


def clear_external_cache() -> None:
    with _lock:
        _cache.clear()
