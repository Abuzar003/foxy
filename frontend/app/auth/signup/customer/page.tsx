import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

const linkClass = "font-medium text-primary transition-smooth hover:opacity-90";

export default function CustomerSignupPage() {
  return (
    <AuthShell wide>
      <div className="rounded-2xl border border-border bg-card-gradient p-8 shadow-soft">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal">
          Customer
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Create your <span className="text-gradient-gold">customer</span> account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Book verified pros for your home — one account for all your bookings.
        </p>

        <div className="mt-8">
          <SignupForm lockedRole="customer" />
        </div>

        <div className="mt-8 space-y-3 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/auth/login" className={linkClass}>
              Sign in
            </Link>
          </p>
          <p>
            Offering services on Haazir?{" "}
            <Link href="/auth/signup/provider" className={linkClass}>
              Sign up as a provider
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
