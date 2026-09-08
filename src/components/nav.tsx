"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Dumbbell, CalendarDays, Trophy, User, FileText, LogOut, Moon, Sun, ShieldCheck, Users, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { NotificationBell } from "@/components/notification-bell";

const LINKS = [
  { href: "/dashboard", label: "Hem", icon: LayoutDashboard },
  { href: "/progress", label: "Utveckling", icon: LineChart },
  { href: "/practice", label: "Träna", icon: Dumbbell },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/test", label: "Prov", icon: FileText },
  { href: "/achievements", label: "Utmärkelser", icon: Trophy },
  { href: "/friends", label: "Vänner", icon: Users },
  { href: "/profile", label: "Profil", icon: User },
];

const MOBILE_LINKS = [
  { href: "/dashboard", label: "Hem", icon: LayoutDashboard },
  { href: "/progress", label: "Utveckling", icon: LineChart },
  { href: "/practice", label: "Träna", icon: Dumbbell },
  { href: "/test", label: "Prov", icon: FileText },
  { href: "/profile", label: "Profil", icon: User },
];

export function Nav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-border bg-surface/80 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            prov<span className="text-primary">et</span>
          </Link>
          <nav className="flex items-center gap-1">
            {LINKS.map((l) => {
              const active = pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  <l.icon size={16} />
                  {l.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                  pathname?.startsWith("/admin") ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground"
                )}
              >
                <ShieldCheck size={16} />
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={toggle}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
              aria-label="Växla tema"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
              aria-label="Logga ut"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          prov<span className="text-primary">et</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
            aria-label="Växla tema"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
            aria-label="Logga ut"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 backdrop-blur md:hidden">
        {MOBILE_LINKS.map((l) => {
          const active = pathname?.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted"
              )}
            >
              <l.icon size={20} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
