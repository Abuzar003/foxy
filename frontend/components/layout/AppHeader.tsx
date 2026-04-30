"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCustomerOffers, getProviderOffers } from "@/lib/offers";

type UserRole = "customer" | "provider" | null;

export function AppHeader() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>(null);
  const [token, setToken] = useState<string | null>(null);
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    const storedRole = localStorage.getItem("user_role");
    const storedToken = localStorage.getItem("access_token");

    if (storedRole === "customer" || storedRole === "provider") {
      setRole(storedRole);
    } else {
      setRole(null);
    }
    setToken(storedToken);

    const loadInboxCount = async () => {
      if (!storedToken || (storedRole !== "customer" && storedRole !== "provider")) {
        setInboxCount(0);
        return;
      }
      try {
        if (storedRole === "provider") {
          const inbox = await getProviderOffers(undefined, storedToken);
          setInboxCount(inbox.pending_count);
        } else {
          const inbox = await getCustomerOffers(undefined, storedToken);
          setInboxCount(inbox.total_count);
        }
      } catch {
        setInboxCount(0);
      }
    };
    void loadInboxCount();
  }, [pathname]);

  const isLoggedIn = Boolean(token && role);
  const aboutHref = role === "provider" ? "/provider/about" : "/customer/about";
  const inboxHref = role === "provider" ? "/inbox/provider" : "/inbox/customer";
  const hideHeader = pathname.startsWith("/auth/");

  if (hideHeader) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={role === "provider" ? "/provider/about" : "/providers/search"} className="text-sm font-semibold tracking-tight text-slate-900">
          ProLink
        </Link>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link
                href={inboxHref}
                className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Open inbox"
                title="Open inbox"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6h16v12H4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h5l2 3h2l2-3h5" />
                </svg>
                {inboxCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-semibold text-white">
                    {inboxCount > 99 ? "99+" : inboxCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href={aboutHref}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Open profile"
                title="Open profile"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="3.2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 19c0-3.1 2.9-5 7-5s7 1.9 7 5" />
                </svg>
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
