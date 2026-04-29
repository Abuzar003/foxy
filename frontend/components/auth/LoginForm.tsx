"use client";

import { useState } from "react";
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
}

export function LoginForm({ onFieldFocus, onFieldBlur, onSubmitIntent }: LoginFormProps) {
  const [apiError, setApiError] = useState("");

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
      localStorage.setItem("access_token", response.token.access_token);
      localStorage.setItem("user_role", response.user.role);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to sign in right now. Please try again.";
      setApiError(message);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_65px_rgba(15,23,42,0.14)] ring-1 ring-slate-100">
      <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        Sign in to continue booking or managing services.
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
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
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
