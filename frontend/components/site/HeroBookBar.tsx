"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";

type ServiceSuggestion = { service: string; category: string; score: number };
type CityRow = { name: string; state: string };

const DEBOUNCE_MS = 280;

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function HeroBookBar() {
  const [serviceInput, setServiceInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const debouncedService = useDebouncedValue(serviceInput, DEBOUNCE_MS);
  const debouncedCity = useDebouncedValue(cityInput, DEBOUNCE_MS);

  const [serviceSuggestions, setServiceSuggestions] = useState<ServiceSuggestion[]>([]);
  const [cityMatches, setCityMatches] = useState<CityRow[]>([]);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setServiceOpen(false);
        setCityOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const fetchServices = useCallback(async (q: string) => {
    try {
      const url = new URL(`${API_BASE_URL}/search/services`);
      url.searchParams.set("q", q);
      url.searchParams.set("limit", "5");
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = (await res.json()) as { suggestions: ServiceSuggestion[] };
      setServiceSuggestions(data.suggestions ?? []);
    } catch {
      setServiceSuggestions([]);
    }
  }, []);

  const fetchCities = useCallback(async (q: string) => {
    if (!q.trim()) {
      setCityMatches([]);
      return;
    }
    try {
      const url = new URL(`${API_BASE_URL}/search/cities`);
      url.searchParams.set("q", q.trim());
      url.searchParams.set("limit", "50");
      url.searchParams.set("mode", "prefix");
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = (await res.json()) as { cities: CityRow[] };
      setCityMatches(data.cities ?? []);
    } catch {
      setCityMatches([]);
    }
  }, []);

  useEffect(() => {
    void fetchServices(debouncedService);
  }, [debouncedService, fetchServices]);

  useEffect(() => {
    void fetchCities(debouncedCity);
  }, [debouncedCity, fetchCities]);

  const loginHref = (() => {
    const params = new URLSearchParams();
    if (serviceInput.trim()) params.set("service_need", serviceInput.trim());
    if (cityInput.trim()) params.set("city", cityInput.trim());
    const q = params.toString();
    return q ? `/auth/login?${q}` : "/auth/login";
  })();

  return (
    <div ref={wrapRef} className="mt-10 mx-auto max-w-3xl rounded-2xl bg-card-gradient border border-border p-3 shadow-soft">
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="What service do you need?"
            value={serviceInput}
            onChange={(e) => {
              setServiceInput(e.target.value);
              setServiceOpen(true);
            }}
            onFocus={() => setServiceOpen(true)}
            className="h-12 pl-11 bg-muted/60 border-border focus-visible:ring-primary"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={serviceOpen}
          />
          {serviceOpen && serviceSuggestions.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
              role="listbox"
            >
              {serviceSuggestions.map((s) => (
                <li key={s.service} role="option">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-muted/80"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setServiceInput(s.service);
                      setServiceOpen(false);
                    }}
                  >
                    <span className="font-medium text-foreground">{s.service}</span>
                    <span className="text-xs text-muted-foreground">{s.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-teal pointer-events-none" />
          <Input
            placeholder="Your city"
            value={cityInput}
            onChange={(e) => {
              setCityInput(e.target.value);
              setCityOpen(true);
            }}
            onFocus={() => setCityOpen(true)}
            className="h-12 pl-11 bg-muted/60 border-border focus-visible:ring-primary"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={cityOpen}
          />
          {cityOpen && cityMatches.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
              role="listbox"
            >
              {cityMatches.map((c) => (
                <li key={`${c.name}-${c.state}`} role="option">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-muted/80"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCityInput(c.name);
                      setCityOpen(false);
                    }}
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.state}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button asChild size="lg" className="h-12 px-8 bg-gold-gradient text-primary-foreground hover:opacity-90 shadow-gold font-semibold">
          <Link href={loginHref}>Find a Pro</Link>
        </Button>
      </div>
    </div>
  );
}
