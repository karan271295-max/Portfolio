"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  CreditCard,
  Target,
  ArrowLeftRight,
  Sparkles,
  Receipt,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entries", label: "Entries", icon: ArrowLeftRight },
  { href: "/assets", label: "Accounts", icon: Wallet },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/liabilities", label: "Liabilities", icon: CreditCard },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/tax", label: "Tax", icon: Receipt },
  { href: "/insights", label: "Insights", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--border)] px-3 py-5 lg:flex">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
        <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-sm font-bold text-white">
          W
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          Wealth<span className="brand-gradient-text">OS</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--surface-hover)] text-[var(--fg)]"
                  : "text-[var(--fg-muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "text-[var(--brand-2)]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--fg-muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
      >
        <Settings className="h-[18px] w-[18px]" />
        Settings
      </Link>
    </aside>
  );
}
