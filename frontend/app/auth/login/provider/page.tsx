import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

const linkClass = "font-medium text-primary transition-smooth hover:opacity-90";

export default function ProviderLoginPage() {
  return (
    <AuthShell>
      <LoginForm expectedRole="provider" />
      <div className="mt-8 space-y-3 text-center text-sm text-muted-foreground">
        <p>
          New pro?{" "}
          <Link href="/auth/signup/provider" className={linkClass}>
            Create a provider account
          </Link>
        </p>
        <p>
          Booking services?{" "}
          <Link href="/auth/login" className={linkClass}>
            Customer sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
