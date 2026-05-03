import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export default function ProviderSignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 px-6 py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-[0_14px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your provider account</h1>
          <p className="mt-1 text-sm text-slate-500">Join as a professional to receive job requests and grow your business.</p>

          <div className="mt-6">
            <SignupForm lockedRole="provider" />
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-slate-900 hover:text-sky-700">
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-slate-500">
            Here to book services?{" "}
            <Link href="/auth/signup/customer" className="font-medium text-slate-900 underline-offset-2 hover:text-sky-700">
              Sign up as a customer
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
