"use client";

import { useState } from "react";
import { Bell, Cloud, HardDrive, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EntryForm } from "@/components/entry/entry-form";
import { usePortfolio } from "@/lib/store";

export function Topbar() {
  const { synced } = usePortfolio();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] px-4 backdrop-blur-xl md:px-6">
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4" /> New entry
      </Button>

      <div className="ml-auto flex items-center gap-2">
        {synced ? (
          <Badge tone="positive">
            <Cloud className="h-3 w-3" /> Synced
          </Badge>
        ) : (
          <Badge tone="neutral">
            <HardDrive className="h-3 w-3" /> Local
          </Badge>
        )}
        <button className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]">
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] text-sm font-semibold text-white">
          K
        </div>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="New entry">
        <EntryForm onDone={() => setOpen(false)} />
      </Drawer>
    </header>
  );
}
