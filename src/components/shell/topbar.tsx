"use client";

import { Cloud, HardDrive, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/lib/store";
import { useNewEntry } from "@/components/entry/new-entry-provider";

export function Topbar() {
  const { synced } = usePortfolio();
  const { openEntry } = useNewEntry();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] px-4 backdrop-blur-xl md:px-6">
      <Button onClick={openEntry} size="sm">
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
      </div>
    </header>
  );
}
