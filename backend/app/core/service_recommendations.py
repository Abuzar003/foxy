"""Rank Haazir's five catalog services from a free-text search query."""

from __future__ import annotations

import re
from app.core.service_taxonomy import SERVICE_TAXONOMY, category_for_service

# Extra tokens matched against the query (lowercased) beyond the official service name.
_SERVICE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "On-Demand Drivers": (
        "driver",
        "drivers",
        "driving",
        "chauffeur",
        "cab",
        "taxi",
        "car",
        "trip",
        "rides",
        "ride",
        "pickup",
        "drop",
        "airport",
        "transport",
        "wheel",
    ),
    "Maids / Helpers": (
        "maid",
        "maids",
        "helper",
        "helpers",
        "housekeeping",
        "housekeep",
        "cleaning",
        "cleaner",
        "domestic",
        "cook",
        "cooking",
        "japa",
        "ayah",
        "nanny",
        "babysit",
    ),
    "Delivery / Helper / Loader": (
        "delivery",
        "deliver",
        "courier",
        "loader",
        "load",
        "lifting",
        "lift",
        "shifting",
        "shift",
        "moving",
        "mover",
        "porter",
        "parcel",
        "package",
        "goods",
    ),
    "Event Helpers": (
        "event",
        "events",
        "wedding",
        "party",
        "waiter",
        "waiters",
        "banquet",
        "usher",
        "setup",
        "cleanup",
        "clean-up",
        "catering",
        "function",
    ),
    "Security Guards": (
        "security",
        "guard",
        "guards",
        "bouncer",
        "watchman",
        "gate",
        "patrol",
        "night",
        "cctv",
        "bodyguard",
    ),
}


def _tokens(text: str) -> set[str]:
    return {t for t in re.split(r"[^\w]+", text.lower()) if len(t) >= 2}


def _all_service_names() -> list[str]:
    return [s for services in SERVICE_TAXONOMY.values() for s in services]


def recommend_services(query: str, *, limit: int = 5) -> list[tuple[str, str, float]]:
    """
    Return (service_name, category, score) sorted by score descending.
    Score is in [0, 1] relative to the best match in this catalog.
    """
    names = _all_service_names()
    q = query.strip().lower()
    if not q:
        return [(s, category_for_service(s) or "", 1.0) for s in names][:limit]

    q_tokens = _tokens(q)
    if not q_tokens:
        q_tokens = {q} if len(q) >= 2 else set()

    raw: list[tuple[str, str, float]] = []
    for service in names:
        category = category_for_service(service) or ""
        cat_lower = category.lower()
        name_lower = service.lower()
        score = 0.0

        if q in name_lower:
            score += 80.0
        if name_lower.startswith(q):
            score += 40.0
        for part in re.split(r"[/\s]+", name_lower):
            part = part.strip()
            if part and q in part:
                score += 25.0
        if q in cat_lower:
            score += 35.0

        for tok in q_tokens:
            if tok in name_lower or tok in cat_lower:
                score += 15.0
            for kw in _SERVICE_KEYWORDS.get(service, ()):
                if tok == kw or tok in kw or kw in tok:
                    score += 22.0

        for kw in _SERVICE_KEYWORDS.get(service, ()):
            if kw in q or q in kw:
                score += 30.0

        raw.append((service, category, score))

    raw.sort(key=lambda x: x[2], reverse=True)
    max_score = raw[0][2] if raw else 0.0
    if max_score <= 0:
        return [(s, category_for_service(s) or "", 0.15) for s in sorted(names)][:limit]

    normalized: list[tuple[str, str, float]] = []
    for service, category, s in raw:
        normalized.append((service, category, min(1.0, s / max_score)))

    normalized.sort(key=lambda x: x[2], reverse=True)
    return normalized[:limit]
