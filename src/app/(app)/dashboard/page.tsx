"use client";

import { usePortfolio } from "@/lib/store";
import {
  summarize,
  allocateBy,
  assetClassLabel,
  xirr,
  cagr,
  concentration,
  healthScore,
} from "@/lib/finance";
import {
  latestSnapshot,
  holdingsFromSnapshot,
  fullHistory,
  netWorthSeries,
  investedFlows,
} from "@/lib/portfolio";
import { formatMoney, formatPercent, formatDate } from "@/lib/format";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, AnimatedNumber } from "@/components/dashboard/stat-card";
import { Gauge } from "@/components/dashboard/gauge";
import { NetWorthChart, AllocationDonut, CHART_COLORS } from "@/components/dashboard/charts";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { snapshots, liabilities, history } = usePortfolio();

  const latest = latestSnapshot(snapshots);
  const holdings = holdingsFromSnapshot(latest);
  const s = summarize(holdings, liabilities);
  const byAccount = allocateBy(holdings, (h) => h.name);
  const byClass = allocateBy(holdings, (h) => assetClassLabel[h.assetClass]);
  const top = concentration(holdings);
  const health = healthScore(s, top.pct);

  const fh = fullHistory(history, snapshots);
  const series = netWorthSeries(fh);
  const flows = investedFlows(fh);
  const xirrPct = flows.length > 1 ? xirr(flows) : 0;
  const first = fh[0];
  const last = fh[fh.length - 1];
  const years = first && last ? Math.max(0.25, (Date.parse(last.date) - Date.parse(first.date)) / (365 * 864e5)) : 1;
  const cagrPct = cagr(s.invested, s.currentValue, years);

  // Period-over-period changes for the activity feed.
  const activity = fh
    .map((p, i) => ({ date: p.date, delta: i === 0 ? 0 : p.value - fh[i - 1].value }))
    .filter((_, i) => i > 0)
    .reverse()
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--fg-muted)]">Good to see you, Karan</p>
          <h1 className="text-2xl font-semibold tracking-tight">Your financial life, in one glance</h1>
        </div>
        <Badge tone="brand">
          <TrendingUp className="h-3 w-3" /> Health {health}/100
        </Badge>
      </div>

      {/* Net worth hero */}
      <Card className="relative overflow-hidden border-[var(--border-strong)] bg-gradient-to-br from-[var(--bg-elevated)] to-[color-mix(in_srgb,var(--brand)_8%,var(--bg-elevated))] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="flex flex-col justify-center gap-3">
            <CardLabel>Total Net Worth</CardLabel>
            <AnimatedNumber value={s.netWorth} format="money" className="text-4xl font-bold tracking-tight md:text-5xl" />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={s.unrealizedGain >= 0 ? "positive" : "negative"}>
                {s.unrealizedGain >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {formatMoney(s.unrealizedGain, "INR", { compact: true, signed: true })} gain
              </Badge>
              <Badge tone={s.unrealizedGainPct >= 0 ? "positive" : "negative"}>
                {formatPercent(s.unrealizedGainPct, { signed: true })}
              </Badge>
              <span className="text-xs text-[var(--fg-subtle)]">
                {latest ? `as of ${formatDate(latest.date)}` : "no entries yet"}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <NetWorthChart data={series} />
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Invested" value={s.invested} format="moneyCompact" />
        <StatCard label="Current Value" value={s.currentValue} format="moneyCompact" />
        <StatCard
          label="Unrealized Gain"
          value={s.unrealizedGain}
          format="moneyCompactSigned"
          tone={s.unrealizedGain >= 0 ? "positive" : "negative"}
          sub={formatPercent(s.unrealizedGainPct, { signed: true })}
        />
        <StatCard label="XIRR" value={xirrPct} format="percent" tone={xirrPct >= 0 ? "positive" : "negative"} />
        <StatCard label="CAGR" value={cagrPct} format="percent" tone={cagrPct >= 0 ? "positive" : "negative"} />
        <StatCard label="Cash" value={s.cash} format="moneyCompact" />
      </div>

      {/* Allocation + health + accounts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardLabel>Allocation by Account</CardLabel>
          <AllocationDonut data={byAccount} />
          <div className="mt-2 space-y-1.5">
            {byAccount.map((slice, i) => (
              <div key={slice.key} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-[var(--fg-muted)]">{slice.key}</span>
                <span className="ml-auto tnum font-medium">{slice.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-4">
          <CardLabel className="self-start">Portfolio Health</CardLabel>
          <Gauge score={health} label="Diversification · Buffer · Leverage" />
          <div className="grid w-full grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface)] p-2">
              <p className="text-[var(--fg-subtle)]">Equity split</p>
              <p className="mt-0.5 font-semibold">
                {(byClass.find((c) => c.key === "Equity")?.pct ?? 0).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface)] p-2">
              <p className="text-[var(--fg-subtle)]">Top account</p>
              <p className="mt-0.5 font-semibold">{top.pct.toFixed(0)}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardLabel>Accounts</CardLabel>
          <div className="mt-3 space-y-2">
            {holdings.map((h) => {
              const g = h.currentValue - h.investedAmount;
              const gp = h.investedAmount > 0 ? (g / h.investedAmount) * 100 : 0;
              return (
                <div key={h.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--surface)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{h.name}</p>
                    <p className="text-xs text-[var(--fg-subtle)]">{formatMoney(h.currentValue, "INR", { compact: true })}</p>
                  </div>
                  <Badge className="ml-auto" tone={g >= 0 ? "positive" : "negative"}>
                    {formatPercent(gp, { signed: true })}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Class bars + activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardLabel>Allocation by Class</CardLabel>
          <div className="mt-3 space-y-3">
            {byClass.map((slice, i) => (
              <div key={slice.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{slice.key}</span>
                  <span className="tnum text-[var(--fg-muted)]">
                    {formatMoney(slice.value, "INR", { compact: true })} · {slice.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                  <div className="h-full rounded-full" style={{ width: `${slice.pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardLabel>Recent Changes</CardLabel>
          <div className="mt-3 space-y-1">
            {activity.map((a) => (
              <div key={a.date} className="flex items-center gap-3 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">Portfolio update</p>
                  <p className="text-xs text-[var(--fg-subtle)]">{formatDate(a.date)}</p>
                </div>
                <span className={`ml-auto tnum text-sm ${a.delta >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                  {formatMoney(a.delta, "INR", { compact: true, signed: true })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
