"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/** Shown on app routes that do not render Navbar or AuthShell (e.g. search, inbox, about). */
export function GlobalThemeToggle() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/auth")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <ThemeToggle />
    </div>
  );
}
