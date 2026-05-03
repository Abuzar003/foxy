import { API_BASE_URL } from "@/lib/api";

export type ServiceSuggestion = { service: string; category: string; score: number };
export type CityRow = { name: string; state: string };

export async function fetchServiceSuggestions(q: string, limit = 5): Promise<ServiceSuggestion[]> {
  try {
    const url = new URL(`${API_BASE_URL}/search/services`);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as { suggestions?: ServiceSuggestion[] };
    return data.suggestions ?? [];
  } catch {
    return [];
  }
}

export async function fetchCityMatches(q: string, limit = 50): Promise<CityRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  try {
    const url = new URL(`${API_BASE_URL}/search/cities`);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("mode", "prefix");
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as { cities?: CityRow[] };
    return data.cities ?? [];
  } catch {
    return [];
  }
}
