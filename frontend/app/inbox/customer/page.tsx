"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getCustomerOffers, OfferInboxResponse, ServiceOffer } from "@/lib/offers";
import { getOfferMessages, sendOfferMessage, OfferMessage } from "@/lib/offerMessages";

export default function CustomerInboxPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [counts, setCounts] = useState<OfferInboxResponse | null>(null);
  const [error, setError] = useState("");
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [threads, setThreads] = useState<Record<string, OfferMessage[]>>({});
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadInbox = async () => {
      const role = localStorage.getItem("user_role");
      const token = localStorage.getItem("access_token");
      if (role !== "customer" || !token) {
        router.replace("/auth/login");
        return;
      }
      setToken(token);
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

  useEffect(() => {
    if (!token) return;
    const intervalId = window.setInterval(async () => {
      try {
        const response = await getCustomerOffers(undefined, token);
        setOffers(response.offers);
        setCounts(response);
      } catch {
        // Silent retry on next tick.
      }
    }, 8000);
    return () => window.clearInterval(intervalId);
  }, [token]);

  const acceptedCount = useMemo(() => counts?.accepted_count ?? 0, [counts]);

  const refreshThread = async (offerId: string) => {
    if (!token) return;
    try {
      const messages = await getOfferMessages(offerId, token);
      setThreads((prev) => ({ ...prev, [offerId]: messages }));
    } catch {
      // Keep inbox usable even if thread fetch fails.
    }
  };

  useEffect(() => {
    if (!token || offers.length === 0) return;
    const intervalId = window.setInterval(() => {
      offers.forEach((offer) => {
        void refreshThread(offer.id);
      });
    }, 6000);
    return () => window.clearInterval(intervalId);
  }, [offers, token]);

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

              <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Messages</p>
                {(threads[offer.id] ?? []).slice(-5).map((m, idx) => (
                  <p key={`${offer.id}-msg-${idx}-${m.created_at}`} className="text-sm text-slate-700">
                    <span className="font-semibold">
                      {m.sender_role === "customer" ? "You" : "Provider"}:
                    </span>{" "}
                    {m.text}
                  </p>
                ))}
                <div className="flex gap-2">
                  <input
                    value={messageDrafts[offer.id] ?? ""}
                    onChange={(event) =>
                      setMessageDrafts((prev) => ({ ...prev, [offer.id]: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    placeholder="Send optional message to provider"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!token) return;
                      const text = messageDrafts[offer.id] ?? "";
                      if (!text.trim()) return;
                      await sendOfferMessage(offer.id, text, token);
                      setMessageDrafts((prev) => ({ ...prev, [offer.id]: "" }));
                      await refreshThread(offer.id);
                    }}
                    className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Send
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshThread(offer.id)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Refresh messages
                </button>
              </div>
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
