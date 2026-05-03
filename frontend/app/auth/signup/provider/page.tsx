import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

const linkClass = "font-medium text-primary transition-smooth hover:opacity-90";

export default function ProviderSignupPage() {
  return (
    <AuthShell wide>
      <div className="rounded-2xl border border-border bg-card-gradient p-8 shadow-soft">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal">
          Provider
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Create your <span className="text-gradient-gold">provider</span> account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join as a professional to receive job requests and grow your business.
        </p>

        <div className="mt-8">
          <SignupForm lockedRole="provider" />
        </div>

        <div className="mt-8 space-y-3 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/auth/login/provider" className={linkClass}>
              Sign in
            </Link>
          </p>
          <p>
            Here to book services?{" "}
            <Link href="/auth/signup/customer" className={linkClass}>
              Sign up as a customer
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
