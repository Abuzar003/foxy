"use client";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemedShell } from "@/components/theme/ThemedShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemedShell>{children}</ThemedShell>
    </ThemeProvider>
  );
}
