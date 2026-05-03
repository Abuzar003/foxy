"""Static Indian city catalog for autocomplete (loaded from bundled JSON)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_DATA_PATH = Path(__file__).with_name("indian_cities.json")


@lru_cache
def _city_rows() -> tuple[dict[str, str], ...]:
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    return tuple({"name": str(r["name"]), "state": str(r["state"])} for r in raw)


def search_cities(query: str, *, mode: str = "prefix", limit: int = 50) -> list[dict[str, str]]:
    """
    Return cities matching ``query`` (case-insensitive).

    - ``prefix`` (default): city name starts with the query (good for single-letter typing).
    - ``contains``: city name contains the query as a substring.
    """
    q = query.strip().lower()
    if not q or limit < 1:
        return []

    mode = mode.strip().lower()
    rows = _city_rows()
    matches: list[dict[str, str]] = []
    for row in rows:
        name_lower = row["name"].lower()
        if mode == "contains":
            ok = q in name_lower
        else:
            ok = name_lower.startswith(q)
        if ok:
            matches.append({"name": row["name"], "state": row["state"]})

    matches.sort(key=lambda r: (r["name"].lower(), r["state"].lower()))
    return matches[:limit]
