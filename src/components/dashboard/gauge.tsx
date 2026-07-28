"use client";

import { motion } from "framer-motion";

// Circular gauge 0..100. Color shifts red -> amber -> green with the score.
export function Gauge({ score, label }: { score: number; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = score >= 70 ? "var(--positive)" : score >= 45 ? "var(--warning)" : "var(--negative)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-hover)" strokeWidth="10" />
          <motion.circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color }}>
            {Math.round(score)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">/ 100</span>
        </div>
      </div>
      <span className="text-sm text-[var(--fg-muted)]">{label}</span>
    </div>
  );
}
