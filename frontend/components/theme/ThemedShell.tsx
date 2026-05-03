"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";
import { GlobalThemeToggle } from "@/components/theme/GlobalThemeToggle";

export function ThemedShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "theme-scope flex min-h-screen w-full flex-1 flex-col bg-background text-foreground antialiased",
        theme === "light" && "light",
      )}
    >
      {children}
      <GlobalThemeToggle />
    </div>
  );
}
