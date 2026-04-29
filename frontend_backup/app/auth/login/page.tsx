"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { InteractiveMascot } from "@/components/auth/InteractiveMascot";
import { LoginForm } from "@/components/auth/LoginForm";

type FocusField = "email" | "password" | null;

export default function LoginPage() {
  const formContainerRef = useRef<HTMLDivElement | null>(null);

  const [focusField, setFocusField] = useState<FocusField>(null);
  const [isLookingAway, setIsLookingAway] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center">
        <div className="order-2 w-full max-w-md lg:order-1">
          <div
            ref={formContainerRef}
            onMouseLeave={() => {
              setIsLookingAway(true);
              setFocusField(null);
            }}
            onMouseEnter={() => setIsLookingAway(false)}
            className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-[0_14px_50px_rgba(15,23,42,0.08)] backdrop-blur"
          >
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to continue booking or managing services.
            </p>

            <div className="mt-6">
              <LoginForm onFieldFocus={(field) => setFocusField(field)} />
            </div>

            <p className="mt-5 text-center text-sm text-slate-600">
              New here?{" "}
              <Link href="/auth/signup" className="font-medium text-slate-900 hover:text-sky-700">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <div className="order-1 flex w-full max-w-sm flex-col items-center lg:order-2">
          <InteractiveMascot
            formContainerRef={formContainerRef}
            focusField={focusField}
            isLookingAway={isLookingAway}
          />
          <p className="mt-3 text-center text-sm text-slate-500">
            Your friendly guide is keeping an eye on your login.
          </p>
        </div>
      </div>
    </main>
  );
}
