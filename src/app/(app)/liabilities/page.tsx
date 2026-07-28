"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { usePortfolio } from "@/lib/store";
import { formatMoney, formatPercent, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { LiabilityForm } from "@/components/assets/liability-form";
import type { Liability } from "@/lib/types";

export default function LiabilitiesPage() {
  const { liabilities } = usePortfolio();
  const [editing, setEditing] = useState<Liability | null>(null);
  const [open, setOpen] = useState(false);

  const total = liabilities.reduce((s, l) => s + l.outstanding, 0);
  const emi = liabilities.reduce((s, l) => s + (l.emi ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Liabilities</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            {formatMoney(total)} outstanding · {formatMoney(emi)}/mo EMI
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add liability
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {liabilities.length === 0 && (
          <Card className="text-sm text-[var(--fg-muted)]">No liabilities. You&apos;re debt-free 🎉</Card>
        )}
        {liabilities.map((l) => (
          <Card
            key={l.id}
            className="cursor-pointer space-y-3 hover:border-[var(--border-strong)]"
            onClick={() => {
              setEditing(l);
              setOpen(true);
            }}
          >
            <div className="flex items-start justify-between">
              <p className="font-medium">{l.name}</p>
              {l.interestRate != null && (
                <span className="text-xs text-[var(--fg-subtle)]">{formatPercent(l.interestRate)}</span>
              )}
            </div>
            <p className="text-2xl font-semibold tracking-tight tnum">{formatMoney(l.outstanding)}</p>
            <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
              <span>EMI {l.emi ? formatMoney(l.emi, "INR", { compact: true }) : "—"}</span>
              <span>{l.dueDate ? `Due ${formatDate(l.dueDate)}` : ""}</span>
            </div>
          </Card>
        ))}
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Edit liability" : "Add liability"}>
        <LiabilityForm liability={editing ?? undefined} onDone={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}
