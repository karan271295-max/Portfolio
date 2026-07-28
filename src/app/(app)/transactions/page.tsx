"use client";

import { usePortfolio } from "@/lib/store";
import { formatMoney, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
  const { transactions } = usePortfolio();
  const rows = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-[var(--fg-muted)]">{rows.length} records</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface)]">
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--fg-muted)]">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">{t.label}</td>
                  <td className="px-4 py-3">
                    <Badge>{t.type.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className={`px-4 py-3 text-right tnum font-medium ${t.amount >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                    {formatMoney(t.amount, "INR", { signed: true })}
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
