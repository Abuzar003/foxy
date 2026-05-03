"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { apiRequest, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "customer" | "provider";

interface BaseSignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
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
  /** When set, the role toggle is hidden and this role is fixed (use dedicated signup URLs). */
  lockedRole?: Role;
}

interface TermsAndConditionsResponse {
  platform: string;
  sections: Array<{
    title: string;
    points: string[];
  }>;
}

export function SignupForm({ defaultRole = "customer", lockedRole }: SignupFormProps) {
  const initialRole = lockedRole ?? defaultRole;
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
  const [signupTaxonomy, setSignupTaxonomy] = useState<Record<string, string[]>>({});
  const [signupTaxonomyError, setSignupTaxonomyError] = useState("");
  const [providerSignupServices, setProviderSignupServices] = useState<string[]>([]);

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
      role: initialRole,
      termsAccepted: false,
    },
  });

  const role = watch("role");
  const phone = watch("phone");
  const termsAccepted = watch("termsAccepted");
  const isPhoneValid = /^(?:\d{10}|\+[1-9]\d{9,14})$/.test(phone ?? "");
  const isProviderRole = (lockedRole ?? role) === "provider";
  const canSubmit =
    isPhoneVerified &&
    Boolean(termsAccepted) &&
    (!isProviderRole || providerSignupServices.length > 0);
  const activeTerms = role === "provider" ? providerTerms : customerTerms;
  const activeTermsError = role === "provider" ? providerTermsError : customerTermsError;

  const inputClass =
    "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground shadow-sm transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/80";

  useEffect(() => {
    const loadTerms = async () => {
      const needCustomer = !lockedRole || lockedRole === "customer";
      const needProvider = !lockedRole || lockedRole === "provider";

      const tasks: Promise<void>[] = [];

      if (needCustomer) {
        tasks.push(
          (async () => {
            try {
              const value = await apiRequest<TermsAndConditionsResponse>("/auth/terms-and-conditions");
              setCustomerTerms(value);
              setCustomerTermsError("");
            } catch (reason) {
              const message =
                reason instanceof ApiError ? reason.message : "Failed to load user terms and conditions.";
              setCustomerTermsError(message);
            }
          })(),
        );
      }

      if (needProvider) {
        tasks.push(
          (async () => {
            try {
              const value = await apiRequest<TermsAndConditionsResponse>("/auth/provider/terms-and-conditions");
              setProviderTerms(value);
              setProviderTermsError("");
            } catch (reason) {
              const message =
                reason instanceof ApiError ? reason.message : "Failed to load provider terms and conditions.";
              setProviderTermsError(message);
            }
          })(),
        );
      }

      await Promise.all(tasks);
    };
    void loadTerms();
  }, [lockedRole]);

  useEffect(() => {
    if (role !== "provider") {
      setProviderSignupServices([]);
    }
  }, [role]);

  useEffect(() => {
    if (!isProviderRole) return;
    let cancelled = false;
    void (async () => {
      try {
        const value = await apiRequest<{ categories: Record<string, string[]> }>("/providers/taxonomy");
        if (!cancelled) {
          setSignupTaxonomy(value.categories);
          setSignupTaxonomyError("");
        }
      } catch (reason) {
        if (!cancelled) {
          const message =
            reason instanceof ApiError ? reason.message : "Failed to load services list.";
          setSignupTaxonomyError(message);
          setSignupTaxonomy({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isProviderRole]);

  const onSubmit = async (data: SignupPayload) => {
    try {
      setApiError("");
      setApiSuccess("");

      const role = lockedRole ?? data.role;
      if (role === "provider" && providerSignupServices.length === 0) {
        setApiError("Select at least one service you offer.");
        return;
      }
      const payload = {
        email: data.email,
        password: data.password,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        phone: data.phone,
        terms_accepted: data.termsAccepted,
        role,
        ...(role === "provider" ? { services: providerSignupServices } : {}),
      };

      const endpoint = role === "provider" ? "/auth/register/provider" : "/auth/register/customer";
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
      {!lockedRole ? (
        <div className="rounded-xl border border-border bg-muted/40 p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setValue("role", "customer", { shouldValidate: true })}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
                role === "customer"
                  ? "border border-border bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setValue("role", "provider", { shouldValidate: true })}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
                role === "provider"
                  ? "border border-border bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Provider
            </button>
          </div>
        </div>
      ) : null}

      <input type="hidden" {...register("role", { required: true })} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-foreground">
            First name
          </label>
          <input
            id="firstName"
            className={inputClass}
            placeholder="Ava"
            {...register("firstName", { required: "First name is required" })}
          />
          {errors.firstName ? (
            <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-foreground">
            Last name
          </label>
          <input
            id="lastName"
            className={inputClass}
            placeholder="Shaw"
            {...register("lastName", { required: "Last name is required" })}
          />
          {errors.lastName ? (
            <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          placeholder="you@example.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Enter a valid email address",
            },
          })}
        />
        {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
          Mobile number
        </label>
        <div className="flex gap-2">
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            disabled={isPhoneVerified}
            className={inputClass}
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
            className="shrink-0 rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-sm font-medium text-foreground transition-smooth hover:border-teal hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSendingOtp ? "Sending..." : "Send OTP"}
          </button>
        </div>
        {errors.phone ? <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p> : null}
        {!errors.phone && !isPhoneVerified ? (
          <p className="mt-1 text-xs text-muted-foreground">Use 10 digits or E.164 format (e.g. +919876543210).</p>
        ) : null}
        {isPhoneVerified ? (
          <span className="mt-2 inline-flex items-center rounded-full border border-teal/40 bg-teal/15 px-2.5 py-1 text-xs font-semibold text-teal">
            Verified
          </span>
        ) : null}
      </div>

      {isOtpSent && !isPhoneVerified ? (
        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
          <label htmlFor="otpCode" className="mb-1.5 block text-sm font-medium text-foreground">
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
              className={cn(inputClass, "tracking-[0.3em]")}
              placeholder="000000"
            />
            <Button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp}
              className="h-11 shrink-0 rounded-xl bg-teal-gradient px-4 text-sm font-semibold text-secondary-foreground shadow-teal hover:opacity-90 disabled:opacity-70"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify"}
            </Button>
          </div>
          {otpError ? <p className="mt-1 text-xs text-destructive">{otpError}</p> : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className={cn(inputClass, "pr-12")}
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
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-smooth hover:text-foreground"
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
          <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      {role === "provider" ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Services you offer</label>
          <p className="mb-2 text-xs text-muted-foreground">
            Choose any combination of the five launch services. You can change these later in your provider profile.
          </p>
          {signupTaxonomyError ? (
            <p className="mb-2 text-xs text-destructive">{signupTaxonomyError}</p>
          ) : null}
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3.5">
            {Object.keys(signupTaxonomy).length === 0 && !signupTaxonomyError ? (
              <p className="text-sm text-muted-foreground">Loading services…</p>
            ) : null}
            {Object.entries(signupTaxonomy).map(([category, services]) => (
              <div key={category} className="rounded-lg border border-border bg-background p-3">
                <p className="mb-2 text-sm font-semibold text-foreground">{category}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {services.map((service) => {
                    const checked = providerSignupServices.includes(service);
                    return (
                      <label key={service} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setProviderSignupServices((prev) =>
                              event.target.checked
                                ? [...prev, service]
                                : prev.filter((item) => item !== service),
                            );
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-foreground">{service}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {providerSignupServices.length === 0 && isPhoneVerified ? (
            <p className="mt-1 text-xs text-destructive">Select at least one service to continue.</p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border bg-muted text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
            {...register("termsAccepted", {
              required: "Please accept Terms & Conditions and Privacy Policy",
            })}
          />
          <span className="text-sm leading-5 text-muted-foreground">
            I agree to the{" "}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShowTerms(true);
              }}
              className="font-medium text-primary underline decoration-border underline-offset-2 transition-smooth hover:opacity-90"
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
              className="font-medium text-primary underline decoration-border underline-offset-2 transition-smooth hover:opacity-90"
            >
              {role === "provider" ? "Provider Policy" : "Privacy Policy"}
            </button>
          </span>
        </label>
        <button
          type="button"
          onClick={() => setShowTerms(true)}
          className="mt-1 text-xs font-medium text-teal underline decoration-border underline-offset-2 transition-smooth hover:text-teal-glow"
        >
          View full {role === "provider" ? "provider" : "user"} terms
        </button>
        {errors.termsAccepted ? (
          <p className="mt-1 text-xs text-destructive">{errors.termsAccepted.message}</p>
        ) : null}
      </div>

      {showTerms ? (
        <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3.5 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">
              {role === "provider" ? "Provider Terms" : "User Terms"}
            </p>
            <button
              type="button"
              onClick={() => setShowTerms(false)}
              className="text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
            >
              Close
            </button>
          </div>
          {activeTerms ? (
            <>
              <p className="font-semibold text-foreground">{activeTerms.platform}</p>
              {activeTerms.sections.map((section) => (
                <div key={section.title}>
                  <p className="font-medium text-foreground">{section.title}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                    {section.points.map((point) => (
                      <li key={`${section.title}-${point}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          ) : activeTermsError ? (
            <p className="text-destructive">{activeTermsError}</p>
          ) : (
            <p className="text-muted-foreground">Loading terms and conditions...</p>
          )}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting || !canSubmit}
        className="h-11 w-full rounded-xl bg-gold-gradient text-sm font-semibold text-primary-foreground shadow-gold transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Creating account..."
          : role === "provider"
            ? "Create provider account"
            : "Create customer account"}
      </Button>
      {!isPhoneVerified ? (
        <p className="text-center text-xs text-muted-foreground">Verify your mobile number to enable signup.</p>
      ) : null}
      {apiError ? <p className="text-center text-sm text-destructive">{apiError}</p> : null}
      {apiSuccess ? (
        <p className="text-center text-sm font-medium text-teal">{apiSuccess}</p>
      ) : null}
    </form>
  );
}
