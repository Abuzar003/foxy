"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";

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
}

interface ProviderSearchResponse {
  providers: ProviderSearchResult[];
}

export default function ProviderSearchPage() {
  const [taxonomy, setTaxonomy] = useState<Record<string, string[]>>({});
  const [category, setCategory] = useState("");
  const [service, setService] = useState("");
  const [address, setAddress] = useState("");
  const [maxPricePerHour, setMaxPricePerHour] = useState("");
  const [maxPricePerDay, setMaxPricePerDay] = useState("");
  const [providers, setProviders] = useState<ProviderSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

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

  const servicesForCategory = useMemo(() => {
    if (!category) return [];
    return taxonomy[category] ?? [];
  }, [category, taxonomy]);

  useEffect(() => {
    setService("");
  }, [category]);

  const searchProviders = async () => {
    try {
      setIsSearching(true);
      setError("");

      const params = new URLSearchParams();
      if (service) params.set("service", service);
      if (category) params.set("category", category);
      if (address.trim()) params.set("address", address.trim());
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
    void searchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 px-6 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Find Providers</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search providers by service, category, location, and budget.
        </p>

        <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="">All categories</option>
                {Object.keys(taxonomy).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Service</label>
              <select
                value={service}
                onChange={(event) => setService(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="">All services</option>
                {(category ? servicesForCategory : Object.values(taxonomy).flat()).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="Area or city"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Max price/hour</label>
              <input
                type="number"
                min="1"
                value={maxPricePerHour}
                onChange={(event) => setMaxPricePerHour(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Max price/day</label>
              <input
                type="number"
                min="1"
                value={maxPricePerDay}
                onChange={(event) => setMaxPricePerDay(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="3000"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void searchProviders()}
              disabled={isSearching}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSearching ? "Searching..." : "Search providers"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setService("");
                setAddress("");
                setMaxPricePerHour("");
                setMaxPricePerDay("");
                void searchProviders();
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <article
              key={provider.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.07)]"
            >
              <div className="flex items-start gap-4">
                {provider.profile_photo ? (
                  <img
                    src={provider.profile_photo}
                    alt={provider.full_name}
                    className="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                    {provider.full_name?.slice(0, 2).toUpperCase() || "PR"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-slate-900">{provider.full_name}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{provider.address || "Address not shared"}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {provider.services.map((item) => (
                  <span
                    key={`${provider.id}-${item}`}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p className="text-slate-600">
                  Hourly:{" "}
                  <span className="font-semibold text-slate-900">
                    {provider.price_per_hour ? `₹${provider.price_per_hour}` : "N/A"}
                  </span>
                </p>
                <p className="text-slate-600">
                  Daily:{" "}
                  <span className="font-semibold text-slate-900">
                    {provider.price_per_day ? `₹${provider.price_per_day}` : "N/A"}
                  </span>
                </p>
                <p className="col-span-2 text-slate-600">
                  Age: <span className="font-semibold text-slate-900">{provider.age ?? "N/A"}</span>
                </p>
              </div>

              {provider.about ? <p className="mt-3 text-sm text-slate-600">{provider.about}</p> : null}
            </article>
          ))}
        </section>

        {!isSearching && providers.length === 0 && !error ? (
          <p className="mt-8 text-center text-sm text-slate-500">No providers matched your filters.</p>
        ) : null}
      </div>
    </main>
  );
}
