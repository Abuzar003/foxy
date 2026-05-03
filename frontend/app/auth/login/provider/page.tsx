"use client";

import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function ProviderLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-12">
      <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-orange-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl ring-1 ring-slate-100">
          <div className="w-full max-w-md">
            <LoginForm expectedRole="provider" onFieldFocus={() => {}} />
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            New pro?{" "}
            <Link href="/auth/signup/provider" className="font-medium text-slate-900 hover:text-sky-700">
              Create a provider account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            Booking services?{" "}
            <Link href="/auth/login" className="font-medium text-slate-800 hover:text-sky-700">
              Customer sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
