"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiError } from "@/lib/api";

export default function CustomerAboutPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
  const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
  const [isVerifyingMobileOtp, setIsVerifyingMobileOtp] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);

  const [email, setEmail] = useState("");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);
  const [isVerifyingPasswordOtp, setIsVerifyingPasswordOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (role !== "customer" || !token) {
      router.replace("/auth/login");
      return;
    }
    setIsBootstrapping(false);
  }, [router]);

  const handleSendMobileOtp = async () => {
    if (!/^(?:\d{10}|\+[1-9]\d{9,14})$/.test(mobileNumber)) {
      setApiError("Enter a valid mobile number first.");
      return;
    }

    try {
      setApiError("");
      setApiSuccess("");
      setIsSendingMobileOtp(true);
      await apiRequest("/auth/send-phone-otp", {
        method: "POST",
        body: { phone: mobileNumber },
      });
      setIsMobileOtpSent(true);
      setApiSuccess("OTP sent to mobile number.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to send mobile OTP.";
      setApiError(message);
    } finally {
      setIsSendingMobileOtp(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (!/^\d{6}$/.test(mobileOtp)) {
      setApiError("Mobile OTP must be 6 digits.");
      return;
    }

    try {
      setApiError("");
      setApiSuccess("");
      setIsVerifyingMobileOtp(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const response = await apiRequest<{ phone: string }>("/auth/customer/mobile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { phone: mobileNumber, otp: mobileOtp },
      });
      setMobileNumber(response.phone);
      setIsMobileVerified(true);
      setIsMobileOtpSent(false);
      setApiSuccess("Mobile number updated successfully.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to verify mobile OTP.";
      setApiError(message);
    } finally {
      setIsVerifyingMobileOtp(false);
    }
  };

  const handleSendPasswordOtp = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setApiError("Enter a valid email first.");
      return;
    }

    try {
      setApiError("");
      setApiSuccess("");
      setIsSendingPasswordOtp(true);
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setApiSuccess("Password OTP sent to your email.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to send password OTP.";
      setApiError(message);
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };

  const handleVerifyPasswordOtp = async () => {
    if (!/^\d{6}$/.test(passwordOtp)) {
      setApiError("Password OTP must be 6 digits.");
      return;
    }

    try {
      setApiError("");
      setApiSuccess("");
      setIsVerifyingPasswordOtp(true);
      const response = await apiRequest<{ message: string; reset_token: string }>("/auth/verify-otp", {
        method: "POST",
        body: { email, otp: passwordOtp },
      });
      setResetToken(response.reset_token);
      setApiSuccess("OTP verified. You can now set a new password.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to verify password OTP.";
      setApiError(message);
    } finally {
      setIsVerifyingPasswordOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setApiError("New password must be at least 8 characters.");
      return;
    }
    if (!resetToken) {
      setApiError("Verify OTP first before changing password.");
      return;
    }

    try {
      setApiError("");
      setApiSuccess("");
      setIsResettingPassword(true);
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: { email, reset_token: resetToken, new_password: newPassword },
      });
      setNewPassword("");
      setPasswordOtp("");
      setResetToken("");
      setApiSuccess("Password changed successfully.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to reset password.";
      setApiError(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isBootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <p className="text-sm text-slate-600">Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 px-6 py-12">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_16px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Change mobile number and password.</p>

        <div className="mt-6 space-y-6">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Change mobile number</h2>
            <div className="flex gap-2">
              <input
                type="tel"
                value={mobileNumber}
                onChange={(event) => {
                  setMobileNumber(event.target.value);
                  setIsMobileVerified(false);
                  setIsMobileOtpSent(false);
                  setMobileOtp("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="9876543210 or +919876543210"
              />
              <button
                type="button"
                onClick={handleSendMobileOtp}
                disabled={isSendingMobileOtp}
                className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSendingMobileOtp ? "Sending..." : "Send OTP"}
              </button>
            </div>

            {isMobileOtpSent ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mobileOtp}
                  onChange={(event) => setMobileOtp(event.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 tracking-[0.25em] text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="000000"
                />
                <button
                  type="button"
                  onClick={handleVerifyMobileOtp}
                  disabled={isVerifyingMobileOtp}
                  className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isVerifyingMobileOtp ? "Verifying..." : "Verify"}
                </button>
              </div>
            ) : null}

            {isMobileVerified ? (
              <p className="text-sm font-medium text-emerald-600">Mobile OTP verified.</p>
            ) : null}
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Change password</h2>

            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="you@example.com"
              />
              <button
                type="button"
                onClick={handleSendPasswordOtp}
                disabled={isSendingPasswordOtp}
                className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSendingPasswordOtp ? "Sending..." : "Send OTP"}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={passwordOtp}
                onChange={(event) => setPasswordOtp(event.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 tracking-[0.25em] text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="Password OTP"
              />
              <button
                type="button"
                onClick={handleVerifyPasswordOtp}
                disabled={isVerifyingPasswordOtp}
                className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isVerifyingPasswordOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </div>

            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
              placeholder="New password (minimum 8 characters)"
            />

            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isResettingPassword ? "Updating..." : "Change password"}
            </button>
          </section>

          {apiError ? <p className="text-center text-sm text-rose-600">{apiError}</p> : null}
          {apiSuccess ? <p className="text-center text-sm text-emerald-600">{apiSuccess}</p> : null}
        </div>
      </div>
    </main>
  );
}
