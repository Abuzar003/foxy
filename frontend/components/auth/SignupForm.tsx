"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { apiRequest, ApiError } from "@/lib/api";

type Role = "customer" | "provider";

interface BaseSignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
  serviceCategory?: string;
}

export interface CustomerSignupPayload extends BaseSignupPayload {
  role: "customer";
}

export interface ProviderSignupPayload extends BaseSignupPayload {
  role: "provider";
}

export type SignupPayload = CustomerSignupPayload | ProviderSignupPayload;

interface SignupFormProps {
  defaultRole?: Role;
}

interface TermsAndConditionsResponse {
  platform: string;
  sections: Array<{
    title: string;
    points: string[];
  }>;
}

export function SignupForm({ defaultRole = "customer" }: SignupFormProps) {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [customerTerms, setCustomerTerms] = useState<TermsAndConditionsResponse | null>(null);
  const [providerTerms, setProviderTerms] = useState<TermsAndConditionsResponse | null>(null);
  const [customerTermsError, setCustomerTermsError] = useState("");
  const [providerTermsError, setProviderTermsError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupPayload>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      role: defaultRole,
      termsAccepted: false,
      serviceCategory: "",
    },
  });

  const role = watch("role");
  const phone = watch("phone");
  const termsAccepted = watch("termsAccepted");
  const isPhoneValid = /^(?:\d{10}|\+[1-9]\d{9,14})$/.test(phone ?? "");
  const canSubmit = isPhoneVerified && Boolean(termsAccepted);
  const activeTerms = role === "provider" ? providerTerms : customerTerms;
  const activeTermsError = role === "provider" ? providerTermsError : customerTermsError;

  useEffect(() => {
    const loadTerms = async () => {
      const [customerResult, providerResult] = await Promise.allSettled([
        apiRequest<TermsAndConditionsResponse>("/auth/terms-and-conditions"),
        apiRequest<TermsAndConditionsResponse>("/auth/provider/terms-and-conditions"),
      ]);

      if (customerResult.status === "fulfilled") {
        setCustomerTerms(customerResult.value);
        setCustomerTermsError("");
      } else {
        const reason = customerResult.reason;
        const message = reason instanceof ApiError ? reason.message : "Failed to load user terms and conditions.";
        setCustomerTermsError(message);
      }

      if (providerResult.status === "fulfilled") {
        setProviderTerms(providerResult.value);
        setProviderTermsError("");
      } else {
        const reason = providerResult.reason;
        const message =
          reason instanceof ApiError ? reason.message : "Failed to load provider terms and conditions.";
        setProviderTermsError(message);
      }
    };
    void loadTerms();
  }, []);

  const onSubmit = async (data: SignupPayload) => {
    try {
      setApiError("");
      setApiSuccess("");

      const payload = {
        email: data.email,
        password: data.password,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        phone: data.phone,
        terms_accepted: data.termsAccepted,
        role: data.role,
        ...(data.role === "provider" ? { service_category: data.serviceCategory } : {}),
      };

      const endpoint = data.role === "provider" ? "/auth/register/provider" : "/auth/register/customer";
      await apiRequest(endpoint, {
        method: "POST",
        body: payload,
      });
      setApiSuccess("Account created successfully. You can now continue.");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to create account right now. Please try again.";
      setApiError(message);
    }
  };

  const handleSendOtp = async () => {
    if (!isPhoneValid || isPhoneVerified) return;
    setIsSendingOtp(true);
    setOtpError("");
    setApiError("");

    try {
      await apiRequest("/auth/send-phone-otp", {
        method: "POST",
        body: { phone },
      });
      setIsOtpSent(true);
      setOtpCode("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to send OTP";
      setOtpError(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = otpCode.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setOtpError("Enter a valid 6-digit OTP");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");
    setApiError("");

    try {
      await apiRequest("/auth/verify-phone-otp", {
        method: "POST",
        body: { phone, otp: cleanOtp },
      });
      setIsPhoneVerified(true);
      setIsOtpSent(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to verify OTP";
      setOtpError(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-xl bg-slate-100 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setValue("role", "customer", { shouldValidate: true })}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              role === "customer"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setValue("role", "provider", { shouldValidate: true })}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              role === "provider"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Provider
          </button>
        </div>
      </div>

      <input type="hidden" {...register("role", { required: true })} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-slate-700">
            First name
          </label>
          <input
            id="firstName"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
            placeholder="Ava"
            {...register("firstName", { required: "First name is required" })}
          />
          {errors.firstName ? (
            <p className="mt-1 text-xs text-rose-500">{errors.firstName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-slate-700">
            Last name
          </label>
          <input
            id="lastName"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
            placeholder="Shaw"
            {...register("lastName", { required: "Last name is required" })}
          />
          {errors.lastName ? (
            <p className="mt-1 text-xs text-rose-500">{errors.lastName.message}</p>
          ) : null}
        </div>
      </div>

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
        />
        {errors.email ? <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
          Mobile number
        </label>
        <div className="flex gap-2">
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            disabled={isPhoneVerified}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="9876543210"
            {...register("phone", {
              required: "Mobile number is required",
              pattern: {
                value: /^(?:\d{10}|\+[1-9]\d{9,14})$/,
                message: "Enter a valid mobile number",
              },
              onChange: () => {
                if (isPhoneVerified) {
                  setIsPhoneVerified(false);
                }
                if (isOtpSent) {
                  setIsOtpSent(false);
                }
                setOtpCode("");
                setOtpError("");
              },
            })}
          />
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={!isPhoneValid || isPhoneVerified || isSendingOtp}
            className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSendingOtp ? "Sending..." : "Send OTP"}
          </button>
        </div>
        {errors.phone ? <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p> : null}
        {!errors.phone && !isPhoneVerified ? (
          <p className="mt-1 text-xs text-slate-500">Use 10 digits or E.164 format (e.g. +919876543210).</p>
        ) : null}
        {isPhoneVerified ? (
          <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Verified
          </span>
        ) : null}
      </div>

      {isOtpSent && !isPhoneVerified ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <label htmlFor="otpCode" className="mb-1.5 block text-sm font-medium text-slate-700">
            Enter OTP
          </label>
          <div className="flex gap-2">
            <input
              id="otpCode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(event) => {
                const sanitized = event.target.value.replace(/\D/g, "");
                setOtpCode(sanitized);
                setOtpError("");
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 tracking-[0.3em] text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
              placeholder="000000"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp}
              className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify"}
            </button>
          </div>
          {otpError ? <p className="mt-1 text-xs text-rose-500">{otpError}</p> : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-12 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
            placeholder="Create a strong password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
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

      {role === "provider" ? (
        <div>
          <label htmlFor="serviceCategory" className="mb-1.5 block text-sm font-medium text-slate-700">
            Service category
          </label>
          <input
            id="serviceCategory"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
            placeholder="Plumbing, Cleaning, Electrician..."
            {...register("serviceCategory", {
              validate: (value) => {
                if (role !== "provider") return true;
                if (!value || value.trim().length < 2) return "Service category is required";
                return true;
              },
            })}
          />
          {errors.serviceCategory ? (
            <p className="mt-1 text-xs text-rose-500">{errors.serviceCategory.message}</p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-300 focus:ring-offset-0"
            {...register("termsAccepted", {
              required: "Please accept Terms & Conditions and Privacy Policy",
            })}
          />
          <span className="text-sm leading-5 text-slate-500">
            I agree to the{" "}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShowTerms(true);
              }}
              className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
            >
              {role === "provider" ? "Provider Terms & Conditions" : "Terms & Conditions"}
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShowTerms(true);
              }}
              className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
            >
              {role === "provider" ? "Provider Policy" : "Privacy Policy"}
            </button>
          </span>
        </label>
        <button
          type="button"
          onClick={() => setShowTerms(true)}
          className="mt-1 text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
        >
          View full {role === "provider" ? "provider" : "user"} terms
        </button>
        {errors.termsAccepted ? (
          <p className="mt-1 text-xs text-rose-500">{errors.termsAccepted.message}</p>
        ) : null}
      </div>

      {showTerms ? (
        <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {role === "provider" ? "Provider Terms" : "User Terms"}
            </p>
            <button
              type="button"
              onClick={() => setShowTerms(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Close
            </button>
          </div>
          {activeTerms ? (
            <>
              <p className="font-semibold text-slate-900">{activeTerms.platform}</p>
              {activeTerms.sections.map((section) => (
                <div key={section.title}>
                  <p className="font-medium text-slate-900">{section.title}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600">
                    {section.points.map((point) => (
                      <li key={`${section.title}-${point}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          ) : activeTermsError ? (
            <p className="text-rose-600">{activeTermsError}</p>
          ) : (
            <p className="text-slate-500">Loading terms and conditions...</p>
          )}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !canSubmit}
        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting
          ? "Creating account..."
          : role === "provider"
            ? "Create provider account"
            : "Create customer account"}
      </button>
      {!isPhoneVerified ? (
        <p className="text-center text-xs text-slate-500">Verify your mobile number to enable signup.</p>
      ) : null}
      {apiError ? <p className="text-center text-sm text-rose-600">{apiError}</p> : null}
      {apiSuccess ? <p className="text-center text-sm text-emerald-600">{apiSuccess}</p> : null}
    </form>
  );
}
