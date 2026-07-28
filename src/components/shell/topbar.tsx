"use client";

import { Search, Bell, Command } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCommandPalette } from "./command-palette";

export function Topbar({ demo }: { demo: boolean }) {
  const { open } = useCommandPalette();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={open}
        className="group flex h-9 flex-1 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg-subtle)] transition-colors hover:border-[var(--border-strong)] md:max-w-md"
      >
        <Search className="h-4 w-4" />
        <span>Search assets, transactions, goals…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--fg-subtle)] sm:flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {demo && <Badge tone="warning">Demo data</Badge>}
        <button className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]">
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] text-sm font-semibold text-white">
          K
        </div>
      </div>
    </header>
  );
}
