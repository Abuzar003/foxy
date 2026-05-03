import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

const linkClass = "font-medium text-primary transition-smooth hover:opacity-90";

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm expectedRole="customer" />
      <div className="mt-8 space-y-3 text-center text-sm text-muted-foreground">
        <p>
          New here?{" "}
          <Link href="/auth/signup/customer" className={linkClass}>
            Create a customer account
          </Link>
        </p>
        <p>
          Pro on Haazir?{" "}
          <Link href="/auth/login/provider" className={linkClass}>
            Sign in as a provider
          </Link>
          <span className="mx-1.5 text-border">·</span>
          <Link href="/auth/signup/provider" className={linkClass}>
            Create a provider account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
