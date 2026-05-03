const GLUED_YMD = /^(\d{4})(\d{2})-(\d{2})-(\d{2})$/;

/**
 * Some clients send a malformed value like `202605-05-05` (YYYYMM-DD-DD, missing hyphen after year).
 * Returns canonical `YYYY-MM-DD` or null if not recoverable.
 */
export function normalizeOfferDateString(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let candidate = s;
  const glued = GLUED_YMD.exec(s);
  if (glued) {
    candidate = `${glued[1]}-${glued[2]}-${glued[3]}`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return null;
  const [y, mo, d] = candidate.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return candidate;
}

/** YYYY-MM-DD in the user's local calendar (for <input type="date" min=…> and validation). */
export function getLocalDateInputString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Windows-style ids from resolvedOptions().timeZone on some browsers / OS builds.
const WINDOWS_TO_IANA: Record<string, string> = {
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
  UTC: "UTC",
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
};

/** IANA zone id for offer payloads (Python zoneinfo); maps Windows names when needed. */
export function getOfferIANATimezone(): string {
  const raw = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim();
  if (!raw) return "Asia/Kolkata";

  if (typeof Intl.supportedValuesOf === "function") {
    try {
      if (Intl.supportedValuesOf("timeZone").includes(raw)) return raw;
    } catch {
      /* ignore */
    }
  }

  if (raw === "UTC" || raw === "GMT") return "UTC";

  const mapped = WINDOWS_TO_IANA[raw] ?? WINDOWS_TO_IANA[raw.replace(/_/g, " ")];
  if (mapped) return mapped;

  if (raw.includes("/")) return raw;

  return "Asia/Kolkata";
}
