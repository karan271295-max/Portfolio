"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { usePortfolio } from "@/lib/store";
import { formatMoney, formatPercent, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EntryForm } from "@/components/entry/entry-form";
import type { Snapshot } from "@/lib/types";

export default function EntriesPage() {
  const { snapshots } = usePortfolio();
  const [editing, setEditing] = useState<Snapshot | null>(null);
  const [open, setOpen] = useState(false);

  const rows = [...snapshots]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((snap) => {
      const vals = Object.values(snap.accounts);
      const invested = vals.reduce((n, e) => n + e.invested, 0);
      const current = vals.reduce((n, e) => n + e.current, 0);
      return { snap, invested, current, gain: current - invested };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entries</h1>
          <p className="text-sm text-[var(--fg-muted)]">{rows.length} logged</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New entry
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Invested</th>
                <th className="px-4 py-3 text-right font-medium">Current</th>
                <th className="px-4 py-3 text-right font-medium">Gain</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[var(--fg-muted)]">
                    No entries yet.
                  </td>
                </tr>
              )}
              {rows.map(({ snap, invested, current, gain }) => (
                <tr
                  key={snap.id}
                  className="cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--surface)]"
                  onClick={() => {
                    setEditing(snap);
                    setOpen(true);
                  }}
                >
                  <td className="px-4 py-3 font-medium">{formatDate(snap.date)}</td>
                  <td className="px-4 py-3 text-right tnum text-[var(--fg-muted)]">{formatMoney(invested, "INR", { compact: true })}</td>
                  <td className="px-4 py-3 text-right tnum font-medium">{formatMoney(current, "INR", { compact: true })}</td>
                  <td className={`px-4 py-3 text-right tnum ${gain >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                    {formatMoney(gain, "INR", { compact: true, signed: true })} ·{" "}
                    {formatPercent(invested > 0 ? (gain / invested) * 100 : 0, { signed: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Edit entry" : "New entry"}>
        <EntryForm snapshot={editing ?? undefined} onDone={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}
