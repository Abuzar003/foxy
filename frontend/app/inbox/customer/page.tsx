"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getCustomerOffers, OfferInboxResponse, ServiceOffer } from "@/lib/offers";

export default function CustomerInboxPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [counts, setCounts] = useState<OfferInboxResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInbox = async () => {
      const role = localStorage.getItem("user_role");
      const token = localStorage.getItem("access_token");
      if (role !== "customer" || !token) {
        router.replace("/auth/login");
        return;
      }
      try {
        const response = await getCustomerOffers(undefined, token);
        setOffers(response.offers);
        setCounts(response);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to load inbox";
        setError(message);
      }
    };
    void loadInbox();
  }, [router]);

  const acceptedCount = useMemo(() => counts?.accepted_count ?? 0, [counts]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Customer Inbox</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your offers and see how many providers agreed.
        </p>

        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Providers agreed: <span className="font-semibold">{acceptedCount}</span>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <section className="mt-6 space-y-3">
          {offers.map((offer) => (
            <article
              key={offer.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">{offer.provider_name}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    offer.status === "accepted"
                      ? "bg-emerald-100 text-emerald-700"
                      : offer.status === "rejected"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {offer.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">Service: {offer.service}</p>
              <p className="mt-1 text-sm text-slate-600">
                Offered: <span className="font-semibold text-slate-900">₹{offer.offered_price}</span> (base ₹
                {offer.base_price})
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Schedule: {offer.total_days} day(s), {offer.total_hours} hour(s)
              </p>
              {offer.message ? <p className="mt-1 text-sm text-slate-600">Your message: {offer.message}</p> : null}
              {offer.provider_reply ? (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Provider message: {offer.provider_reply}
                </p>
              ) : null}
            </article>
          ))}
        </section>

        {offers.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-500">No offers yet. Start from provider search.</p>
        ) : null}
      </div>
    </main>
  );
}
