"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AUTH_CHANGED_EVENT, notifyAuthChanged } from "@/lib/auth-events";

type UserRole = "customer" | "provider" | null;

const links = [
  { href: "#services", label: "Services" },
  { href: "#how", label: "How it works" },
  { href: "#support", label: "Support" },
  { href: "#about", label: "About" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [token, setToken] = useState<string | null>(null);

  const rehydrateAuth = useCallback(() => {
    const storedRole = localStorage.getItem("user_role");
    const storedToken = localStorage.getItem("access_token");
    setToken(storedToken);
    setRole(storedRole === "customer" || storedRole === "provider" ? storedRole : null);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    rehydrateAuth();
    window.addEventListener("storage", rehydrateAuth);
    window.addEventListener(AUTH_CHANGED_EVENT, rehydrateAuth);
    return () => {
      window.removeEventListener("storage", rehydrateAuth);
      window.removeEventListener(AUTH_CHANGED_EVENT, rehydrateAuth);
    };
  }, [rehydrateAuth]);

  const isLoggedIn = Boolean(token && role);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    setToken(null);
    setRole(null);
    notifyAuthChanged();
    setOpen(false);
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-smooth ${
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : "bg-transparent"
      }`}
    >
      <nav className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gold-gradient shadow-gold">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-xl font-bold tracking-tight text-gradient-gold">Haazir</span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <Button asChild variant="ghost" className="text-foreground hover:text-primary">
                <Link href={role === "provider" ? "/provider/about" : "/providers/search"}>
                  {role === "provider" ? "Dashboard" : "Browse"}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-foreground hover:text-primary">
                <Link href={role === "provider" ? "/inbox/provider" : "/inbox/customer"}>Inbox</Link>
              </Button>
              <Button asChild variant="outline" className="border-border">
                <Link href={role === "provider" ? "/provider/about" : "/customer/about"}>Account</Link>
              </Button>
              <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-foreground hover:text-primary">
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild variant="ghost" className="text-foreground hover:text-primary">
                <Link href="/auth/signup/provider">Become a Provider</Link>
              </Button>
              <Button asChild className="bg-gold-gradient text-primary-foreground hover:opacity-90 shadow-gold font-semibold">
                <Link href="/auth/signup/customer">Book Now</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button className="p-2 text-foreground" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <ul className="container py-4 flex flex-col gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block py-2 text-muted-foreground hover:text-foreground">
                  {l.label}
                </a>
              </li>
            ))}
            <li className="flex flex-col gap-2 pt-2">
              {isLoggedIn ? (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={role === "provider" ? "/provider/about" : "/providers/search"} onClick={() => setOpen(false)}>
                      {role === "provider" ? "Dashboard" : "Browse services"}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={role === "provider" ? "/inbox/provider" : "/inbox/customer"} onClick={() => setOpen(false)}>
                      Inbox
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={role === "provider" ? "/provider/about" : "/customer/about"} onClick={() => setOpen(false)}>
                      Account
                    </Link>
                  </Button>
                  <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={logout}>
                    Log out
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/login" onClick={() => setOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                  <div className="flex gap-3">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href="/auth/signup/provider" onClick={() => setOpen(false)}>
                        Provider
                      </Link>
                    </Button>
                    <Button asChild className="flex-1 bg-gold-gradient text-primary-foreground font-semibold">
                      <Link href="/auth/signup/customer" onClick={() => setOpen(false)}>
                        Book Now
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
