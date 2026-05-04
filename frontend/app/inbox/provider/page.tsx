"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getProviderOffers, ServiceOffer, updateOfferStatus } from "@/lib/offers";
import { getOfferMessages, sendOfferMessage, OfferMessage } from "@/lib/offerMessages";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const linkClass = "font-medium text-primary transition-smooth hover:opacity-90";

const inputClass =
  "w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function statusBadgeClass(status: string) {
  if (status === "accepted") {
    return "border border-teal/40 bg-teal/15 text-teal";
  }
  if (status === "rejected") {
    return "border border-destructive/30 bg-destructive/10 text-destructive";
  }
  return "border border-border bg-muted text-muted-foreground";
}

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
    const t = localStorage.getItem("access_token");
    if (role !== "provider" || !t) {
      router.replace("/auth/login/provider");
      return;
    }
    setToken(t);
    try {
      const response = await getProviderOffers(undefined, t);
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
    <AuthShell maxWidthClass="max-w-4xl">
      <div className="rounded-2xl border border-border bg-card-gradient p-8 shadow-soft">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal">
          Inbox
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Provider <span className="text-gradient-gold">inbox</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review incoming offers, accept or reject bids, and message customers when needed.
        </p>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <section className="mt-8 space-y-4">
          {offers.map((offer) => (
            <article
              key={offer.id}
              className="rounded-2xl border border-border bg-background p-4 shadow-soft"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{offer.customer_name}</h2>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                    statusBadgeClass(offer.status),
                  )}
                >
                  {offer.status === "accepted" ? "booking confirmed" : offer.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Service: <span className="text-foreground">{offer.service}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bid:{" "}
                <span className="font-semibold text-foreground">₹{offer.offered_price}</span> (base ₹
                {offer.base_price})
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Schedule: {offer.total_days} day(s), {offer.total_hours} hour(s)
              </p>
              {offer.message ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Customer message: <span className="text-foreground">{offer.message}</span>
                </p>
              ) : null}

              {offer.status === "pending" ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={2}
                    value={replyDrafts[offer.id] ?? ""}
                    onChange={(event) =>
                      setReplyDrafts((prev) => ({ ...prev, [offer.id]: event.target.value }))
                    }
                    className={cn(inputClass, "min-h-[4.5rem] resize-y")}
                    placeholder="Optional message to customer"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl bg-teal-gradient font-semibold text-secondary-foreground shadow-teal hover:opacity-90"
                      onClick={async () => {
                        const t = localStorage.getItem("access_token");
                        if (!t) return;
                        await updateOfferStatus(offer.id, "accepted", t, replyDrafts[offer.id]);
                        await refreshOffers();
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-xl font-semibold"
                      onClick={async () => {
                        const t = localStorage.getItem("access_token");
                        if (!t) return;
                        await updateOfferStatus(offer.id, "rejected", t, replyDrafts[offer.id]);
                        await refreshOffers();
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}

              {offer.provider_reply ? (
                <p className="mt-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
                  Your message: {offer.provider_reply}
                </p>
              ) : null}

              <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Messages
                </p>
                {(threads[offer.id] ?? []).slice(-5).map((m, idx) => (
                  <p key={`${offer.id}-msg-${idx}-${m.created_at}`} className="text-sm text-foreground">
                    <span className="font-semibold text-muted-foreground">
                      {m.sender_role === "provider" ? "You" : "Customer"}:
                    </span>{" "}
                    {m.text}
                  </p>
                ))}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    value={messageDrafts[offer.id] ?? ""}
                    onChange={(event) =>
                      setMessageDrafts((prev) => ({ ...prev, [offer.id]: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="Send optional message to customer"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="shrink-0 rounded-xl bg-gold-gradient font-semibold text-primary-foreground shadow-gold hover:opacity-90 sm:h-auto sm:px-4"
                    onClick={async () => {
                      if (!token) return;
                      const text = messageDrafts[offer.id] ?? "";
                      if (!text.trim()) return;
                      await sendOfferMessage(offer.id, text, token);
                      setMessageDrafts((prev) => ({ ...prev, [offer.id]: "" }));
                      await refreshThread(offer.id);
                    }}
                  >
                    Send
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => void refreshThread(offer.id)}
                >
                  Refresh messages
                </Button>
              </div>
            </article>
          ))}
        </section>

        {offers.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">No offers in your inbox yet.</p>
        ) : null}

        <div className="mt-8 space-y-3 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>
            <Link href="/provider/about" className={linkClass}>
              Edit provider profile
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
