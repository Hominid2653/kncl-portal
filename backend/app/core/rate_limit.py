import time
from collections import defaultdict
from threading import Lock

from app.core.config import settings
from app.core.exceptions import RateLimitExceeded


class InMemoryRateLimiter:
    def __init__(self, *, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str) -> None:
        now = time.time()
        with self._lock:
            hits = [timestamp for timestamp in self._hits[key] if now - timestamp < self.window_seconds]
            if len(hits) >= self.max_requests:
                raise RateLimitExceeded("Too many external lookup requests. Try again later.")
            hits.append(now)
            self._hits[key] = hits


external_lookup_limiter = InMemoryRateLimiter(
    max_requests=settings.external_api_rate_limit_requests,
    window_seconds=settings.external_api_rate_limit_window_seconds,
)
