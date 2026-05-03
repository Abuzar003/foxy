import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AuthShell({
  children,
  wide,
}: {
  children: React.ReactNode;
  /** Wider column for signup forms */
  wide?: boolean;
}) {
  return (
    <main className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-hero" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <header className="relative z-10 border-b border-border/80 bg-background/75 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 transition-smooth hover:opacity-90">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-gradient shadow-gold">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-lg font-bold tracking-tight text-gradient-gold">Haazir</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 md:py-14">
        <div className={cn("w-full animate-fade-up", wide ? "max-w-lg" : "max-w-md")}>{children}</div>
      </div>
    </main>
  );
}
