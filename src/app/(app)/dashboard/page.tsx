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
  buildNetWorthSeries,
} from "@/lib/finance";
import { formatMoney, formatPercent, formatDate } from "@/lib/format";
import type { AssetClass } from "@/lib/types";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, AnimatedNumber } from "@/components/dashboard/stat-card";
import { Gauge } from "@/components/dashboard/gauge";
import { NetWorthChart, AllocationDonut, CHART_COLORS } from "@/components/dashboard/charts";
import { ArrowUpRight, ArrowDownRight, TrendingUp, CalendarClock } from "lucide-react";

export default function DashboardPage() {
  const { holdings, liabilities, transactions, history } = usePortfolio();
  const s = summarize(holdings, liabilities);
  const byClass = allocateBy(holdings, (h) => assetClassLabel[h.assetClass]);
  const top = concentration(holdings);
  const health = healthScore(s, top.pct);

  // Prefer the imported net-worth history; fall back to reconstructing from transactions.
  const series = history.length ? history : buildNetWorthSeries(s.netWorth, transactions);
  const startDate = series[0]?.date ?? new Date().toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const years = Math.max(0.25, (Date.parse(today) - Date.parse(startDate)) / (365 * 864e5));

  // XIRR from signed cashflows: buys are cash out (−), sells/redemptions cash in (+),
  // current portfolio value is the terminal inflow. Falls back to a single cost-basis
  // lump when there are no transaction-level flows.
  const flows = transactions.length
    ? [
        ...transactions.map((t) => ({ date: t.date, amount: -t.amount })),
        { date: today, amount: s.currentValue },
      ]
    : [
        { date: startDate, amount: -s.invested },
        { date: today, amount: s.currentValue },
      ];
  const xirrPct = xirr(flows);
  const cagrPct = cagr(s.invested, s.currentValue, years);
  const gainUp = s.dayChange >= 0;

  const upcoming = [
    ...holdings
      .filter((h) => h.maturityDate)
      .map((h) => ({ label: h.name, date: h.maturityDate!, kind: "Maturity", amount: h.currentValue })),
    ...liabilities
      .filter((l) => l.dueDate)
      .map((l) => ({ label: l.name, date: l.dueDate!, kind: "Due", amount: -(l.emi ?? l.outstanding) })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <AnimatedNumber
              value={s.netWorth}
              format="money"
              className="text-4xl font-bold tracking-tight md:text-5xl"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={gainUp ? "positive" : "negative"}>
                {gainUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {formatMoney(s.dayChange, "INR", { signed: true })} today
              </Badge>
              <Badge tone={gainUp ? "positive" : "negative"}>
                {formatPercent(s.dayChangePct, { signed: true })}
              </Badge>
              <span className="text-xs text-[var(--fg-subtle)]">
                {formatMoney(s.totalAssets, "INR", { compact: true })} assets ·{" "}
                {formatMoney(s.totalLiabilities, "INR", { compact: true })} liabilities
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <NetWorthChart data={series} />
          </div>
        </div>
      </Card>

      {/* KPI grid */}
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
        <StatCard
          label="Passive Income"
          value={s.passiveIncome}
          format="moneyCompact"
          sub="per year"
        />
      </div>

      {/* Allocation + health + upcoming */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardLabel>Asset Allocation</CardLabel>
          <AllocationDonut data={byClass} />
          <div className="mt-2 space-y-1.5">
            {byClass.slice(0, 6).map((slice, i) => (
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
              <p className="text-[var(--fg-subtle)]">Emergency Fund</p>
              <p className="mt-0.5 font-semibold">{s.emergencyMonths.toFixed(1)} mo</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface)] p-2">
              <p className="text-[var(--fg-subtle)]">Top Holding</p>
              <p className="mt-0.5 font-semibold">{top.pct.toFixed(0)}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[var(--brand-2)]" />
            <CardLabel className="!mb-0">Upcoming</CardLabel>
          </div>
          <div className="space-y-2">
            {upcoming.map((u, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--surface)] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">{u.label}</p>
                  <p className="text-xs text-[var(--fg-subtle)]">{u.kind} · {formatDate(u.date)}</p>
                </div>
                <span className={`ml-auto tnum text-sm ${u.amount >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                  {formatMoney(u.amount, "INR", { compact: true, signed: true })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Holdings breakdown + recent activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardLabel>Holdings by Class</CardLabel>
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
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${slice.pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardLabel>Recent Activity</CardLabel>
          <div className="mt-3 space-y-1">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">{t.label}</p>
                  <p className="text-xs text-[var(--fg-subtle)]">{formatDate(t.date)}</p>
                </div>
                <span className={`ml-auto tnum text-sm ${t.amount >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                  {formatMoney(t.amount, "INR", { compact: true, signed: true })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
