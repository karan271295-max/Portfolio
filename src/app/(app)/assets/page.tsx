"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { usePortfolio } from "@/lib/store";
import { assetClassLabel } from "@/lib/finance";
import { formatMoney, formatPercent } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { AssetForm } from "@/components/assets/asset-form";
import type { Holding } from "@/lib/types";

export default function AssetsPage() {
  const { holdings } = usePortfolio();
  const [editing, setEditing] = useState<Holding | null>(null);
  const [open, setOpen] = useState(false);

  const rows = holdings
    .map((h) => ({
      ...h,
      gain: h.currentValue - h.investedAmount,
      gainPct: h.investedAmount > 0 ? ((h.currentValue - h.investedAmount) / h.investedAmount) * 100 : 0,
    }))
    .sort((a, b) => b.currentValue - a.currentValue);

  const total = rows.reduce((s, r) => s + r.currentValue, 0);

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(h: Holding) {
    setEditing(h);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            {rows.length} holdings · {formatMoney(total)} total
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add asset
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Account</th>
                <th className="px-4 py-3 text-right font-medium">Invested</th>
                <th className="px-4 py-3 text-right font-medium">Current</th>
                <th className="px-4 py-3 text-right font-medium">Gain</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--fg-muted)]">
                    No assets yet. Click <span className="text-[var(--fg)]">Add asset</span> to start.
                  </td>
                </tr>
              )}
              {rows.map((h) => (
                <tr
                  key={h.id}
                  className="group cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--surface)]"
                  onClick={() => openEdit(h)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{h.name}</p>
                    <p className="text-xs text-[var(--fg-subtle)]">
                      {h.sector ?? h.kind} · {h.country}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-muted)]">{assetClassLabel[h.assetClass]}</td>
                  <td className="hidden px-4 py-3 text-[var(--fg-muted)] md:table-cell">
                    {h.account ?? h.broker ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tnum text-[var(--fg-muted)]">
                    {formatMoney(h.investedAmount, h.currency, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-right tnum font-medium">
                    {formatMoney(h.currentValue, h.currency, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone={h.gain >= 0 ? "positive" : "negative"}>
                      {formatPercent(h.gainPct, { signed: true })}
                    </Badge>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Pencil className="h-4 w-4 text-[var(--fg-subtle)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Edit asset" : "Add asset"}>
        <AssetForm holding={editing ?? undefined} onDone={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}
