"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/api";
import { getLocalDateInputString, getOfferIANATimezone, normalizeOfferDateString } from "@/lib/clientTimezone";
import { createOffer, getCustomerOffers } from "@/lib/offers";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  fetchCityMatches,
  fetchServiceSuggestions,
  type CityRow,
  type ServiceSuggestion,
} from "@/lib/searchApi";

const linkClass = "font-medium text-primary transition-smooth hover:opacity-90";
const SEARCH_DEBOUNCE_MS = 280;

function categoryForCatalogService(taxonomy: Record<string, string[]>, catalogService: string): string {
  for (const [cat, list] of Object.entries(taxonomy)) {
    if (list.includes(catalogService)) return cat;
  }
  return "";
}

const inputClass =
  "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground shadow-sm transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const selectClass = inputClass;

interface ServiceTaxonomyResponse {
  categories: Record<string, string[]>;
}

interface ProviderSearchResult {
  id: string;
  full_name: string;
  phone?: string;
  address?: string;
  services: string[];
  price_per_day?: number;
  price_per_hour?: number;
  profile_photo?: string;
  about?: string;
  age?: number;
  rating_average?: number;
  rating_count?: number;
}

interface ProviderSearchResponse {
  providers: ProviderSearchResult[];
}

interface FeedbackDraft {
  rating: number;
  review: string;
}

interface ProviderReview {
  rating: number;
  comment: string;
  reviewer_id?: string;
  created_at?: string;
}

interface ProviderReviewsResponse {
  provider_id: string;
  rating_average: number;
  rating_count: number;
  reviews: ProviderReview[];
}

function ProviderSearchInner() {
  const searchParams = useSearchParams();
  const filtersWrapRef = useRef<HTMLDivElement>(null);

  const [taxonomy, setTaxonomy] = useState<Record<string, string[]>>({});
  const [serviceNeedInput, setServiceNeedInput] = useState("");
  const [address, setAddress] = useState("");
  const [maxPricePerHour, setMaxPricePerHour] = useState("");
  const [maxPricePerDay, setMaxPricePerDay] = useState("");
  const [providers, setProviders] = useState<ProviderSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [activeFeedbackProviderId, setActiveFeedbackProviderId] = useState<string | null>(null);
  const [activeOfferProviderId, setActiveOfferProviderId] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, FeedbackDraft>>({});
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, string>>({});
  const [providerReviews, setProviderReviews] = useState<Record<string, ProviderReviewsResponse>>({});
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<Record<string, boolean>>({});
  const [offerPrice, setOfferPrice] = useState<Record<string, string>>({});
  const [offerService, setOfferService] = useState<Record<string, string>>({});
  const [offerMessage, setOfferMessage] = useState<Record<string, string>>({});
  const [offerStatus, setOfferStatus] = useState<Record<string, string>>({});
  const [offerScheduleType, setOfferScheduleType] = useState<Record<string, "single" | "multi">>({});
  const [offerDate, setOfferDate] = useState<Record<string, string>>({});
  const [offerStartTime, setOfferStartTime] = useState<Record<string, string>>({});
  const [offerEndTime, setOfferEndTime] = useState<Record<string, string>>({});
  const [offerSlots, setOfferSlots] = useState<
    Record<string, Array<{ date: string; start_time: string; end_time: string }>>
  >({});
  const [eligibleReviewProviderIds, setEligibleReviewProviderIds] = useState<Set<string>>(new Set());

  const debouncedServiceNeed = useDebouncedValue(serviceNeedInput, SEARCH_DEBOUNCE_MS);
  const debouncedAddress = useDebouncedValue(address, SEARCH_DEBOUNCE_MS);
  const [serviceSuggestions, setServiceSuggestions] = useState<ServiceSuggestion[]>([]);
  const [cityMatches, setCityMatches] = useState<CityRow[]>([]);
  const [serviceSuggestOpen, setServiceSuggestOpen] = useState(false);
  const [citySuggestOpen, setCitySuggestOpen] = useState(false);

  const timeOptions = useMemo(() => {
    const slots: Array<{ value: string; label: string }> = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += 30) {
        const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        const ampm = hour >= 12 ? "PM" : "AM";
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        const label = `${String(h12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
        slots.push({ value, label });
      }
    }
    return slots;
  }, []);

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const response = await apiRequest<ServiceTaxonomyResponse>("/providers/taxonomy");
        setTaxonomy(response.categories);
      } catch {
        setError("Failed to load service categories.");
      }
    };

    void loadTaxonomy();
  }, []);

  useEffect(() => {
    void (async () => {
      setServiceSuggestions(await fetchServiceSuggestions(debouncedServiceNeed, 5));
    })();
  }, [debouncedServiceNeed]);

  useEffect(() => {
    void (async () => {
      setCityMatches(await fetchCityMatches(debouncedAddress, 50));
    })();
  }, [debouncedAddress]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (filtersWrapRef.current && !filtersWrapRef.current.contains(e.target as Node)) {
        setServiceSuggestOpen(false);
        setCitySuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initialSearchDoneRef = useRef(false);

  const searchProviders = async (
    direct?: Partial<{ service: string; category: string; address: string }>,
  ) => {
    try {
      setIsSearching(true);
      setError("");

      let svcParam = "";
      let catParam = "";
      let addrParam = address.trim();

      const usedDirect =
        direct &&
        (direct.service !== undefined || direct.category !== undefined || direct.address !== undefined);

      if (usedDirect) {
        svcParam = direct.service ?? "";
        catParam = direct.category ?? "";
        if (direct.address !== undefined) addrParam = direct.address.trim();
      } else {
        const typed = serviceNeedInput.trim();
        if (!typed) {
          svcParam = "";
          catParam = "";
        } else {
          const flat = Object.values(taxonomy).flat();
          const exact =
            flat.find((s) => s === typed) ?? flat.find((s) => s.toLowerCase() === typed.toLowerCase());
          if (!exact) {
            setError("Pick a service from the suggestions, or clear the field to browse all providers.");
            setIsSearching(false);
            return;
          }
          svcParam = exact;
          catParam = categoryForCatalogService(taxonomy, exact);
        }
        if (svcParam) setServiceNeedInput(svcParam);
      }

      const params = new URLSearchParams();
      if (svcParam) params.set("service", svcParam);
      if (catParam) params.set("category", catParam);
      if (addrParam.length >= 2) params.set("address", addrParam);
      if (maxPricePerHour.trim()) params.set("max_price_per_hour", maxPricePerHour.trim());
      if (maxPricePerDay.trim()) params.set("max_price_per_day", maxPricePerDay.trim());
      params.set("limit", "20");

      const query = params.toString();
      const response = await apiRequest<ProviderSearchResponse>(
        `/providers/search${query ? `?${query}` : ""}`,
      );
      setProviders(response.providers);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Search failed. Please try again.";
      setError(message);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (Object.keys(taxonomy).length === 0) return;
    if (initialSearchDoneRef.current) return;
    initialSearchDoneRef.current = true;

    const need = searchParams.get("service_need")?.trim() ?? "";
    const city = searchParams.get("city")?.trim() ?? "";
    if (need) setServiceNeedInput(need);
    if (city) setAddress(city);

    const flat = Object.values(taxonomy).flat();
    const svc = need && flat.includes(need) ? need : "";
    const cat = svc ? categoryForCatalogService(taxonomy, svc) : "";

    void searchProviders({ service: svc, category: cat, address: city });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxonomy, searchParams]);

  useEffect(() => {
    const loadEligibleReviewProviders = async () => {
      const role = localStorage.getItem("user_role");
      const token = localStorage.getItem("access_token");
      if (role !== "customer" || !token) return;

      try {
        const inbox = await getCustomerOffers("accepted", token);
        const now = Date.now();
        const completedProviderIds = inbox.offers
          .filter((offer) => offer.slots.some((slot) => new Date(slot.end_at_utc).getTime() < now))
          .map((offer) => offer.provider_id);
        setEligibleReviewProviderIds(new Set(completedProviderIds));
      } catch {
        // Keep view usable even if eligibility fetch fails.
      }
    };

    void loadEligibleReviewProviders();
  }, []);

  const updateFeedbackDraft = (providerId: string, patch: Partial<FeedbackDraft>) => {
    setFeedbackDrafts((prev) => ({
      ...prev,
      [providerId]: {
        rating: prev[providerId]?.rating ?? 0,
        review: prev[providerId]?.review ?? "",
        ...patch,
      },
    }));
  };

  const loadProviderReviews = async (providerId: string) => {
    try {
      const response = await apiRequest<ProviderReviewsResponse>(`/providers/${providerId}/reviews`);
      setProviderReviews((prev) => ({ ...prev, [providerId]: response }));
    } catch {
      // Keep UI resilient even if review history fails.
    }
  };

  const submitFeedback = async (providerId: string) => {
    if (!eligibleReviewProviderIds.has(providerId)) {
      setFeedbackStatus((prev) => ({
        ...prev,
        [providerId]: "Feedback is allowed only after service completion.",
      }));
      return;
    }

    const draft = feedbackDrafts[providerId];
    if (!draft || draft.rating < 1 || !draft.review.trim()) {
      setFeedbackStatus((prev) => ({
        ...prev,
        [providerId]: "Please select a star rating and write a short review.",
      }));
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setFeedbackStatus((prev) => ({
        ...prev,
        [providerId]: "Please login as customer to submit feedback.",
      }));
      return;
    }

    try {
      setIsSubmittingFeedback((prev) => ({ ...prev, [providerId]: true }));
      await apiRequest(`/providers/${providerId}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          rating: draft.rating,
          comment: draft.review.trim(),
        },
      });

      setFeedbackStatus((prev) => ({
        ...prev,
        [providerId]: "Feedback submitted successfully.",
      }));
      setFeedbackDrafts((prev) => ({
        ...prev,
        [providerId]: { rating: 0, review: "" },
      }));
      await Promise.all([searchProviders(), loadProviderReviews(providerId)]);
      setActiveFeedbackProviderId(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to submit feedback right now.";
      setFeedbackStatus((prev) => ({
        ...prev,
        [providerId]: message,
      }));
    } finally {
      setIsSubmittingFeedback((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const submitOffer = async (provider: ProviderSearchResult) => {
    const role = localStorage.getItem("user_role");
    const token = localStorage.getItem("access_token");
    if (!token || role !== "customer") {
      setOfferStatus((prev) => ({
        ...prev,
        [provider.id]: "Please login as a customer to send offers.",
      }));
      return;
    }

    const basePrice = provider.price_per_hour ?? provider.price_per_day ?? 1;
    const offered = Number(offerPrice[provider.id] || 0);
    const service = offerService[provider.id] || provider.services[0] || "";
    const scheduleType = offerScheduleType[provider.id] ?? "single";

    if (!service) {
      setOfferStatus((prev) => ({ ...prev, [provider.id]: "Select a service before sending offer." }));
      return;
    }
    if (!Number.isFinite(offered) || offered < basePrice) {
      setOfferStatus((prev) => ({
        ...prev,
        [provider.id]: `Offer must be at least base price ₹${basePrice}.`,
      }));
      return;
    }

    try {
      const todayDateStr = getLocalDateInputString();
      const offerTz = getOfferIANATimezone();

      if (scheduleType === "single") {
        const dateRaw = offerDate[provider.id];
        const date = normalizeOfferDateString(dateRaw ?? "") ?? dateRaw;
        const start = offerStartTime[provider.id];
        const end = offerEndTime[provider.id];
        if (!date || !start || !end) {
          setOfferStatus((prev) => ({
            ...prev,
            [provider.id]: "Select date, start time, and end time.",
          }));
          return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          setOfferStatus((prev) => ({
            ...prev,
            [provider.id]: "Use a valid service date (YYYY-MM-DD).",
          }));
          return;
        }
        if (date < todayDateStr) {
          setOfferStatus((prev) => ({
            ...prev,
            [provider.id]: "Service date cannot be in the past.",
          }));
          return;
        }
        await createOffer(
          {
            provider_id: provider.id,
            service,
            base_price: basePrice,
            offered_price: offered,
            message: offerMessage[provider.id]?.trim() || undefined,
            schedule_type: "single",
            date,
            start_time: start,
            end_time: end,
            timezone: offerTz,
          },
          token,
        );
      } else {
        const slotsRaw = offerSlots[provider.id] ?? [];
        const slots = slotsRaw.map((s) => ({
          ...s,
          date: normalizeOfferDateString(s.date) ?? s.date,
        }));
        if (slots.length === 0 || slots.some((s) => !s.date || !s.start_time || !s.end_time)) {
          setOfferStatus((prev) => ({
            ...prev,
            [provider.id]: "Add at least one complete slot for multi schedule.",
          }));
          return;
        }
        if (slots.some((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s.date))) {
          setOfferStatus((prev) => ({
            ...prev,
            [provider.id]: "Each slot needs a valid date (YYYY-MM-DD).",
          }));
          return;
        }
        const hasPastDate = slots.some((slot) => slot.date < todayDateStr);
        if (hasPastDate) {
          setOfferStatus((prev) => ({
            ...prev,
            [provider.id]: "Slot dates cannot be in the past.",
          }));
          return;
        }
        await createOffer(
          {
            provider_id: provider.id,
            service,
            base_price: basePrice,
            offered_price: offered,
            message: offerMessage[provider.id]?.trim() || undefined,
            schedule_type: "multi",
            slots,
            timezone: offerTz,
          },
          token,
        );
      }

      setOfferStatus((prev) => ({ ...prev, [provider.id]: "Offer sent to provider inbox." }));
      setActiveOfferProviderId(null);
      setOfferMessage((prev) => ({ ...prev, [provider.id]: "" }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to send offer.";
      setOfferStatus((prev) => ({ ...prev, [provider.id]: message }));
    }
  };

  return (
    <AuthShell maxWidthClass="max-w-6xl">
      <div className="rounded-2xl border border-border bg-card-gradient p-8 shadow-soft">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal">
          Search
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Find <span className="text-gradient-gold">providers</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search by service and city (same as the home page), plus optional budget caps. Sign in as a customer to
          send offers or leave reviews after a completed booking.
        </p>

        <section
          ref={filtersWrapRef}
          className="mt-8 rounded-2xl border border-border bg-background p-6 shadow-soft"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="relative lg:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Service</label>
              <Search className="pointer-events-none absolute left-3 top-[2.125rem] z-10 h-4 w-4 text-muted-foreground" />
              <input
                value={serviceNeedInput}
                onChange={(event) => {
                  setServiceNeedInput(event.target.value);
                  setServiceSuggestOpen(true);
                }}
                onFocus={() => setServiceSuggestOpen(true)}
                className={cn(inputClass, "pl-10")}
                placeholder="What service do you need?"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={serviceSuggestOpen}
              />
              {serviceSuggestOpen && serviceSuggestions.length > 0 ? (
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
                          setServiceNeedInput(s.service);
                          setServiceSuggestOpen(false);
                        }}
                      >
                        <span className="font-medium text-foreground">{s.service}</span>
                        <span className="text-xs text-muted-foreground">{s.category}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-foreground">City / area</label>
              <MapPin className="pointer-events-none absolute left-3 top-[2.125rem] z-10 h-4 w-4 text-teal" />
              <input
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setCitySuggestOpen(true);
                }}
                onFocus={() => setCitySuggestOpen(true)}
                className={cn(inputClass, "pl-10")}
                placeholder="Your city"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={citySuggestOpen}
              />
              {citySuggestOpen && cityMatches.length > 0 ? (
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
                          setAddress(c.name);
                          setCitySuggestOpen(false);
                        }}
                      >
                        <span className="font-medium text-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.state}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Max price/hour</label>
              <input
                type="number"
                min="1"
                value={maxPricePerHour}
                onChange={(event) => setMaxPricePerHour(event.target.value)}
                className={inputClass}
                placeholder="500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Max price/day</label>
              <input
                type="number"
                min="1"
                value={maxPricePerDay}
                onChange={(event) => setMaxPricePerDay(event.target.value)}
                className={inputClass}
                placeholder="3000"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void searchProviders()}
              disabled={isSearching}
              className="rounded-xl bg-gold-gradient font-semibold text-primary-foreground shadow-gold transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSearching ? "Searching…" : "Search providers"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setServiceNeedInput("");
                setAddress("");
                setMaxPricePerHour("");
                setMaxPricePerDay("");
                setServiceSuggestOpen(false);
                setCitySuggestOpen(false);
                void searchProviders({ service: "", category: "", address: "" });
              }}
              className="rounded-xl font-semibold"
            >
              Reset
            </Button>
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <article
              key={provider.id}
              className="rounded-2xl border border-border bg-background p-5 shadow-soft"
            >
              <div className="flex items-start gap-4">
                {provider.profile_photo ? (
                  <img
                    src={provider.profile_photo}
                    alt={provider.full_name}
                    className="h-14 w-14 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground ring-1 ring-border">
                    {provider.full_name?.slice(0, 2).toUpperCase() || "PR"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-foreground">{provider.full_name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {provider.address || "Address not shared"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Rating:{" "}
                    <span className="font-semibold text-foreground">
                      {provider.rating_average ? provider.rating_average.toFixed(1) : "N/A"}
                    </span>{" "}
                    ({provider.rating_count ?? 0} reviews)
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {provider.services.map((item) => (
                  <span
                    key={`${provider.id}-${item}`}
                    className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p className="text-muted-foreground">
                  Hourly:{" "}
                  <span className="font-semibold text-foreground">
                    {provider.price_per_hour ? `₹${provider.price_per_hour}` : "N/A"}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Daily:{" "}
                  <span className="font-semibold text-foreground">
                    {provider.price_per_day ? `₹${provider.price_per_day}` : "N/A"}
                  </span>
                </p>
                <p className="col-span-2 text-muted-foreground">
                  Age: <span className="font-semibold text-foreground">{provider.age ?? "N/A"}</span>
                </p>
              </div>

              {provider.about ? (
                <p className="mt-3 text-sm text-muted-foreground">{provider.about}</p>
              ) : null}

              <div className="mt-4 border-t border-border pt-4">
                <div className="mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-semibold"
                    onClick={() => {
                      setActiveOfferProviderId((prev) => (prev === provider.id ? null : provider.id));
                      if (!offerPrice[provider.id]) {
                        const base = provider.price_per_hour ?? provider.price_per_day ?? 1;
                        setOfferPrice((prev) => ({ ...prev, [provider.id]: String(base) }));
                      }
                      if (!offerService[provider.id]) {
                        setOfferService((prev) => ({ ...prev, [provider.id]: provider.services[0] ?? "" }));
                      }
                      if (!offerScheduleType[provider.id]) {
                        setOfferScheduleType((prev) => ({ ...prev, [provider.id]: "single" }));
                      }
                    }}
                  >
                    {activeOfferProviderId === provider.id ? "Close offer" : "Bid / Send Offer"}
                  </Button>
                </div>

                {activeOfferProviderId === provider.id ? (
                  <div className="mb-4 space-y-3 rounded-xl border border-border bg-muted/30 p-3.5">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Service</label>
                        <select
                          value={offerService[provider.id] ?? ""}
                          onChange={(event) =>
                            setOfferService((prev) => ({ ...prev, [provider.id]: event.target.value }))
                          }
                          className={selectClass}
                        >
                          {provider.services.map((s) => (
                            <option key={`${provider.id}-${s}`} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                          Your bid (minimum ₹{provider.price_per_hour ?? provider.price_per_day ?? 1})
                        </label>
                        <input
                          type="number"
                          min={provider.price_per_hour ?? provider.price_per_day ?? 1}
                          value={offerPrice[provider.id] ?? ""}
                          onChange={(event) =>
                            setOfferPrice((prev) => ({ ...prev, [provider.id]: event.target.value }))
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                        Schedule type
                      </label>
                      <select
                        value={offerScheduleType[provider.id] ?? "single"}
                        onChange={(event) =>
                          setOfferScheduleType((prev) => ({
                            ...prev,
                            [provider.id]: event.target.value as "single" | "multi",
                          }))
                        }
                        className={selectClass}
                      >
                        <option value="single">Single date</option>
                        <option value="multi">Multiple dates</option>
                      </select>
                    </div>

                    {(offerScheduleType[provider.id] ?? "single") === "single" ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <input
                          type="date"
                          min={getLocalDateInputString()}
                          value={offerDate[provider.id] ?? ""}
                          onChange={(event) => {
                            const raw = event.target.value;
                            const fixed = normalizeOfferDateString(raw);
                            setOfferDate((prev) => ({ ...prev, [provider.id]: fixed ?? raw }));
                          }}
                          className={inputClass}
                        />
                        <select
                          value={offerStartTime[provider.id] ?? ""}
                          onChange={(event) =>
                            setOfferStartTime((prev) => ({ ...prev, [provider.id]: event.target.value }))
                          }
                          className={selectClass}
                        >
                          <option value="">Start time</option>
                          {timeOptions.map((slot) => (
                            <option key={`single-start-${slot.value}`} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={offerEndTime[provider.id] ?? ""}
                          onChange={(event) =>
                            setOfferEndTime((prev) => ({ ...prev, [provider.id]: event.target.value }))
                          }
                          className={selectClass}
                        >
                          <option value="">End time</option>
                          {timeOptions.map((slot) => (
                            <option key={`single-end-${slot.value}`} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2 rounded-xl border border-border bg-background p-2.5">
                        {(offerSlots[provider.id] ?? []).map((slot, idx) => (
                          <div key={`${provider.id}-slot-${idx}`} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <input
                              type="date"
                              min={getLocalDateInputString()}
                              value={slot.date}
                              onChange={(event) => {
                                const raw = event.target.value;
                                const fixed = normalizeOfferDateString(raw);
                                setOfferSlots((prev) => {
                                  const next = [...(prev[provider.id] ?? [])];
                                  next[idx] = { ...next[idx], date: fixed ?? raw };
                                  return { ...prev, [provider.id]: next };
                                });
                              }}
                              className={inputClass}
                            />
                            <select
                              value={slot.start_time}
                              onChange={(event) =>
                                setOfferSlots((prev) => {
                                  const next = [...(prev[provider.id] ?? [])];
                                  next[idx] = { ...next[idx], start_time: event.target.value };
                                  return { ...prev, [provider.id]: next };
                                })
                              }
                              className={selectClass}
                            >
                              <option value="">Start time</option>
                              {timeOptions.map((opt) => (
                                <option key={`multi-start-${idx}-${opt.value}`} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={slot.end_time}
                              onChange={(event) =>
                                setOfferSlots((prev) => {
                                  const next = [...(prev[provider.id] ?? [])];
                                  next[idx] = { ...next[idx], end_time: event.target.value };
                                  return { ...prev, [provider.id]: next };
                                })
                              }
                              className={selectClass}
                            >
                              <option value="">End time</option>
                              {timeOptions.map((opt) => (
                                <option key={`multi-end-${idx}-${opt.value}`} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-xs font-semibold"
                          onClick={() =>
                            setOfferSlots((prev) => ({
                              ...prev,
                              [provider.id]: [
                                ...(prev[provider.id] ?? []),
                                { date: "", start_time: "", end_time: "" },
                              ],
                            }))
                          }
                        >
                          Add slot
                        </Button>
                      </div>
                    )}
                    <textarea
                      rows={2}
                      value={offerMessage[provider.id] ?? ""}
                      onChange={(event) =>
                        setOfferMessage((prev) => ({ ...prev, [provider.id]: event.target.value }))
                      }
                      className={cn(inputClass, "min-h-[4.5rem] resize-y")}
                      placeholder="Optional message for provider"
                    />
                    <Button
                      type="button"
                      onClick={() => void submitOffer(provider)}
                      className="w-full rounded-xl bg-teal-gradient font-semibold text-secondary-foreground shadow-teal hover:opacity-90"
                    >
                      Send offer
                    </Button>
                  </div>
                ) : null}

                {offerStatus[provider.id] ? (
                  <p className="mb-3 text-xs text-muted-foreground">{offerStatus[provider.id]}</p>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-semibold"
                  onClick={() => {
                    if (!eligibleReviewProviderIds.has(provider.id)) return;
                    setActiveFeedbackProviderId((prev) => (prev === provider.id ? null : provider.id));
                    void loadProviderReviews(provider.id);
                  }}
                  disabled={!eligibleReviewProviderIds.has(provider.id)}
                >
                  {eligibleReviewProviderIds.has(provider.id)
                    ? activeFeedbackProviderId === provider.id
                      ? "Close feedback"
                      : "Give feedback"
                    : "Feedback after service"}
                </Button>

                {!eligibleReviewProviderIds.has(provider.id) ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Feedback is enabled only after your service is completed with this provider.
                  </p>
                ) : null}

                {activeFeedbackProviderId === provider.id ? (
                  <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/30 p-3.5">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Rate this provider</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const selected = (feedbackDrafts[provider.id]?.rating ?? 0) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => updateFeedbackDraft(provider.id, { rating: star })}
                              className={cn(
                                "rounded p-1 transition-smooth",
                                selected
                                  ? "text-amber-500"
                                  : "text-muted-foreground hover:text-amber-400",
                              )}
                              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                            >
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                <path d="M12 17.3l-6.16 3.24 1.18-6.87L2 8.86l6.92-1.01L12 1.6l3.08 6.25L22 8.86l-5.02 4.81 1.18 6.87z" />
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Review</label>
                      <textarea
                        rows={3}
                        value={feedbackDrafts[provider.id]?.review ?? ""}
                        onChange={(event) =>
                          updateFeedbackDraft(provider.id, { review: event.target.value })
                        }
                        className={cn(inputClass, "min-h-[6rem] resize-y")}
                        placeholder="How was the service quality and professionalism?"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => void submitFeedback(provider.id)}
                      disabled={Boolean(isSubmittingFeedback[provider.id])}
                      className="w-full rounded-xl bg-gold-gradient font-semibold text-primary-foreground shadow-gold transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmittingFeedback[provider.id] ? "Submitting…" : "Submit feedback"}
                    </Button>

                    {(providerReviews[provider.id]?.reviews?.length ?? 0) > 0 ? (
                      <div className="space-y-2 border-t border-border pt-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Recent reviews
                        </p>
                        {providerReviews[provider.id].reviews.slice(0, 3).map((review, idx) => (
                          <div
                            key={`${provider.id}-review-${idx}`}
                            className="rounded-lg border border-border bg-muted/40 p-2"
                          >
                            <p className="text-xs font-medium text-amber-600">
                              {"★".repeat(review.rating)}{" "}
                              <span className="text-muted-foreground">({review.rating}/5)</span>
                            </p>
                            <p className="mt-0.5 text-sm text-foreground">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {feedbackStatus[provider.id] ? (
                  <p className="mt-2 text-xs text-muted-foreground">{feedbackStatus[provider.id]}</p>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        {!isSearching && providers.length === 0 && !error ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">No providers matched your filters.</p>
        ) : null}

        <div className="mt-8 space-y-3 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>
            <Link href="/inbox/customer" className={linkClass}>
              Customer inbox
            </Link>
          </p>
          <p>
            <Link href="/" className={linkClass}>
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

export default function ProviderSearchPage() {
  return (
    <Suspense
      fallback={
        <AuthShell maxWidthClass="max-w-6xl">
          <p className="p-8 text-sm text-muted-foreground">Loading search…</p>
        </AuthShell>
      }
    >
      <ProviderSearchInner />
    </Suspense>
  );
}
