"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-muted/50 text-foreground transition-smooth hover:border-primary hover:bg-muted hover:shadow-soft"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {!mounted ? (
        <span className="h-4 w-4 rounded-full bg-muted-foreground/30" aria-hidden />
      ) : theme === "dark" ? (
        <Sun className="h-4 w-4 text-primary" strokeWidth={2} />
      ) : (
        <Moon className="h-4 w-4 text-teal" strokeWidth={2} />
      )}
    </button>
  );
}
