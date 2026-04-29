from time import time
from typing import Any, Optional

MEMORY_CACHE: dict[str, dict[str, Any]] = {}


class LocalCache:
    async def connect(self) -> None:
        # Keep async signature compatible with previous external cache setup.
        return None

    async def disconnect(self) -> None:
        # Optional cleanup for tests/restarts.
        MEMORY_CACHE.clear()

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        MEMORY_CACHE[key] = {
            "value": value,
            "expires_at": time() + ttl_seconds,
        }

    async def get(self, key: str) -> Optional[str]:
        item = MEMORY_CACHE.get(key)
        if not item:
            return None

        expires_at = item["expires_at"]
        if expires_at <= time():
            MEMORY_CACHE.pop(key, None)
            return None

        return item["value"]

    async def delete(self, key: str) -> None:
        MEMORY_CACHE.pop(key, None)

    @property
    def client(self) -> "LocalCache":
        # Preserve compatibility with dependency injection returning cache.client.
        return self


cache = LocalCache()
