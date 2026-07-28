"use client";

import { usePortfolio } from "@/lib/store";
import { assetClassLabel } from "@/lib/finance";
import { latestSnapshot, holdingsFromSnapshot } from "@/lib/portfolio";
import { formatMoney, formatPercent, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AssetsPage() {
  const { snapshots } = usePortfolio();
  const latest = latestSnapshot(snapshots);
  const rows = holdingsFromSnapshot(latest).map((h) => ({
    ...h,
    gain: h.currentValue - h.investedAmount,
    gainPct: h.investedAmount > 0 ? ((h.currentValue - h.investedAmount) / h.investedAmount) * 100 : 0,
  }));
  const total = rows.reduce((s, r) => s + r.currentValue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            {formatMoney(total)} total{latest ? ` · as of ${formatDate(latest.date)}` : ""}
          </p>
        </div>
        <span className="text-xs text-[var(--fg-subtle)]">Use “New entry” to update values</span>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 text-right font-medium">Invested</th>
                <th className="px-4 py-3 text-right font-medium">Current</th>
                <th className="px-4 py-3 text-right font-medium">Gain</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--fg-muted)]">
                    No entries yet. Click <span className="text-[var(--fg)]">New entry</span> to log your portfolio.
                  </td>
                </tr>
              )}
              {rows.map((h) => (
                <tr key={h.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface)]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{h.name}</p>
                    <p className="text-xs text-[var(--fg-subtle)]">{h.country}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-muted)]">{assetClassLabel[h.assetClass]}</td>
                  <td className="px-4 py-3 text-right tnum text-[var(--fg-muted)]">{formatMoney(h.investedAmount, "INR", { compact: true })}</td>
                  <td className="px-4 py-3 text-right tnum font-medium">{formatMoney(h.currentValue, "INR", { compact: true })}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone={h.gain >= 0 ? "positive" : "negative"}>{formatPercent(h.gainPct, { signed: true })}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
