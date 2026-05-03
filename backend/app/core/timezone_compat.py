"""Resolve browser / OS timezone strings to IANA names understood by zoneinfo."""

from __future__ import annotations

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Windows display names (Intl / legacy) -> IANA (subset; extend as needed).
_WINDOWS_TO_IANA: dict[str, str] = {
    "India Standard Time": "Asia/Kolkata",
    "Sri Lanka Standard Time": "Asia/Colombo",
    "Pakistan Standard Time": "Asia/Karachi",
    "Bangladesh Standard Time": "Asia/Dhaka",
    "Nepal Standard Time": "Asia/Kathmandu",
    "Singapore Standard Time": "Asia/Singapore",
    "Malay Peninsula Standard Time": "Asia/Kuala_Lumpur",
    "Arabian Standard Time": "Asia/Dubai",
    "Arab Standard Time": "Asia/Riyadh",
    "Iran Standard Time": "Asia/Tehran",
    "Israel Standard Time": "Asia/Jerusalem",
    "Jordan Standard Time": "Asia/Amman",
    "China Standard Time": "Asia/Shanghai",
    "Tokyo Standard Time": "Asia/Tokyo",
    "Korea Standard Time": "Asia/Seoul",
    "Taipei Standard Time": "Asia/Taipei",
    "W. Australia Standard Time": "Australia/Perth",
    "AUS Eastern Standard Time": "Australia/Sydney",
    "New Zealand Standard Time": "Pacific/Auckland",
    "UTC": "UTC",
    "UTC+00:00": "UTC",
    "GMT Standard Time": "Europe/London",
    "Greenwich Standard Time": "Atlantic/Reykjavik",
    "Central European Standard Time": "Europe/Warsaw",
    "W. Europe Standard Time": "Europe/Berlin",
    "Romance Standard Time": "Europe/Paris",
    "Russian Standard Time": "Europe/Moscow",
    "South Africa Standard Time": "Africa/Johannesburg",
    "Egypt Standard Time": "Africa/Cairo",
    "Eastern Standard Time": "America/New_York",
    "US Eastern Standard Time": "America/New_York",
    "Central Standard Time": "America/Chicago",
    "US Central Standard Time": "America/Chicago",
    "Mountain Standard Time": "America/Denver",
    "US Mountain Standard Time": "America/Denver",
    "Pacific Standard Time": "America/Los_Angeles",
    "US Pacific Standard Time": "America/Los_Angeles",
    "Atlantic Standard Time": "America/Halifax",
    "Canada Central Standard Time": "America/Winnipeg",
    "SA Pacific Standard Time": "America/Bogota",
    "E. South America Standard Time": "America/Sao_Paulo",
    "Argentina Standard Time": "America/Buenos_Aires",
}


def resolve_client_timezone(name: str) -> tuple[ZoneInfo, str]:
    """
    Return (ZoneInfo, canonical IANA id) for a client-supplied timezone string.
    Falls back to Asia/Kolkata when empty or unrecognized (matches API default).
    """
    raw = (name or "").strip()
    if not raw:
        return ZoneInfo("Asia/Kolkata"), "Asia/Kolkata"

    try:
        z = ZoneInfo(raw)
        return z, raw
    except ZoneInfoNotFoundError:
        pass

    mapped = _WINDOWS_TO_IANA.get(raw)
    if mapped:
        return ZoneInfo(mapped), mapped

    raw_norm = raw.replace("_", " ")
    mapped = _WINDOWS_TO_IANA.get(raw_norm)
    if mapped:
        return ZoneInfo(mapped), mapped

    for win_name, iana in _WINDOWS_TO_IANA.items():
        if win_name.lower() == raw.lower():
            return ZoneInfo(iana), iana

    return ZoneInfo("Asia/Kolkata"), "Asia/Kolkata"
