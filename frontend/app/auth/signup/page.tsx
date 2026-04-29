import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 px-6 py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-[0_14px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose your role and start as a customer or provider.
          </p>

          <div className="mt-6">
            <SignupForm defaultRole="customer" />
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-slate-900 hover:text-sky-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
