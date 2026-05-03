"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getProviderOffers, ServiceOffer, updateOfferStatus } from "@/lib/offers";
import { getOfferMessages, sendOfferMessage, OfferMessage } from "@/lib/offerMessages";

export default function ProviderInboxPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [threads, setThreads] = useState<Record<string, OfferMessage[]>>({});
  const [token, setToken] = useState<string | null>(null);

  const refreshOffers = async () => {
    const role = localStorage.getItem("user_role");
    const token = localStorage.getItem("access_token");
    if (role !== "provider" || !token) {
      router.replace("/auth/login/provider");
      return;
    }
    setToken(token);
    try {
      const response = await getProviderOffers(undefined, token);
      setOffers(response.offers);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load provider inbox";
      setError(message);
    }
  };

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
    void refreshOffers();
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const intervalId = window.setInterval(() => {
      void refreshOffers();
    }, 8000);
    return () => window.clearInterval(intervalId);
  }, [token]);

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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50 px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Provider Inbox</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review incoming offers, accept/reject bids, and optionally send a message.
        </p>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <section className="mt-6 space-y-3">
          {offers.map((offer) => (
            <article
              key={offer.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">{offer.customer_name}</h2>
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
                Bid: <span className="font-semibold text-slate-900">₹{offer.offered_price}</span> (base ₹
                {offer.base_price})
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Schedule: {offer.total_days} day(s), {offer.total_hours} hour(s)
              </p>
              {offer.message ? (
                <p className="mt-1 text-sm text-slate-600">Customer message: {offer.message}</p>
              ) : null}

              {offer.status === "pending" ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={2}
                    value={replyDrafts[offer.id] ?? ""}
                    onChange={(event) =>
                      setReplyDrafts((prev) => ({ ...prev, [offer.id]: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
                    placeholder="Optional message to customer"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const token = localStorage.getItem("access_token");
                        if (!token) return;
                        await updateOfferStatus(offer.id, "accepted", token, replyDrafts[offer.id]);
                        await refreshOffers();
                      }}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const token = localStorage.getItem("access_token");
                        if (!token) return;
                        await updateOfferStatus(offer.id, "rejected", token, replyDrafts[offer.id]);
                        await refreshOffers();
                      }}
                      className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : null}

              {offer.provider_reply ? (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Your message: {offer.provider_reply}
                </p>
              ) : null}

              <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Messages</p>
                {(threads[offer.id] ?? []).slice(-5).map((m, idx) => (
                  <p key={`${offer.id}-msg-${idx}-${m.created_at}`} className="text-sm text-slate-700">
                    <span className="font-semibold">
                      {m.sender_role === "provider" ? "You" : "Customer"}:
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
                    placeholder="Send optional message to customer"
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
          <p className="mt-8 text-center text-sm text-slate-500">No offers in your inbox yet.</p>
        ) : null}
      </div>
    </main>
  );
}
