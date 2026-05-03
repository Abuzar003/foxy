"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { apiRequest, ApiError } from "@/lib/api";

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: "customer" | "provider";
    phone?: string;
    service_category?: string;
    is_active: boolean;
    created_at: string;
  };
  token: {
    access_token: string;
    token_type: string;
  };
}

type FocusField = "email" | "password";

interface LoginFormProps {
  onFieldFocus: (field: FocusField) => void;
  onFieldBlur?: () => void;
  onSubmitIntent?: () => void;
  /** When set, only accounts with this role may complete sign-in (wrong role shows a clear message). */
  expectedRole?: "customer" | "provider";
}

export function LoginForm({ onFieldFocus, onFieldBlur, onSubmitIntent, expectedRole }: LoginFormProps) {
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginPayload>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginPayload) => {
    try {
      setApiError("");
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: data,
      });
      if (expectedRole && response.user.role !== expectedRole) {
        setApiError(
          expectedRole === "provider"
            ? "This account is not registered as a provider. Use customer sign-in, or create a provider account."
            : "This account is not registered as a customer. Use provider sign-in, or create a customer account.",
        );
        return;
      }

      localStorage.setItem("access_token", response.token.access_token);
      localStorage.setItem("user_role", response.user.role);
      localStorage.setItem("user_id", response.user.id);
      localStorage.setItem("user_name", response.user.full_name);
      if (response.user.role === "provider") {
        router.push("/provider/about");
      } else {
        router.push("/providers/search");
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to sign in right now. Please try again.";
      setApiError(message);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_65px_rgba(15,23,42,0.14)] ring-1 ring-slate-100">
      <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900">
        {expectedRole === "provider" ? "Provider sign in" : "Welcome back"}
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        {expectedRole === "provider"
          ? "Sign in to manage your profile, inbox, and jobs."
          : "Sign in to continue booking or managing services."}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
            placeholder="you@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Enter a valid email address",
              },
            })}
            onFocus={() => onFieldFocus("email")}
            onBlur={onFieldBlur}
          />
          {errors.email ? (
            <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-12 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              onFocus={() => onFieldFocus("password")}
              onBlur={onFieldBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 7 9 7a17.6 17.6 0 01-3.04 3.94M6.1 6.1C3.9 7.77 2.5 10 2.5 10S6.5 17 12 17c1.48 0 2.83-.27 4.05-.72"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.5 12S6.5 5 12 5s9.5 7 9.5 7-4 7-9.5 7-9.5-7-9.5-7z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          onClick={onSubmitIntent}
          disabled={isSubmitting}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        {apiError ? <p className="text-center text-sm text-rose-600">{apiError}</p> : null}
      </form>
    </div>
  );
}
