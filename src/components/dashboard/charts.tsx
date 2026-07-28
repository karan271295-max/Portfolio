"use client";

import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";
import type { NetWorthPoint } from "@/lib/types";
import type { AllocationSlice } from "@/lib/finance";

export const CHART_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
  "#f472b6",
  "#38bdf8",
  "#4ade80",
];

export function NetWorthChart({ data }: { data: NetWorthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { month: "short" })}
          tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis
          tickFormatter={(v) => formatMoney(v, "INR", { compact: true })}
          tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--fg-muted)" }}
          formatter={(v) => [formatMoney(Number(v)), "Net worth"]}
          labelFormatter={(d) => new Date(d as string).toLocaleDateString("en-IN", { dateStyle: "medium" })}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#nw)"
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AllocationDonut({ data }: { data: AllocationSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius={62}
          outerRadius={95}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(v, n) => [formatMoney(Number(v)), n as string]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
