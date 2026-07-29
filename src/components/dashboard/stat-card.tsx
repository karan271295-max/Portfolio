"use client";

import { animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

// Serializable format kinds — functions can't cross the server→client boundary.
export type FormatKind =
  | "money"
  | "moneyCompact"
  | "moneyCompactSigned"
  | "percent"
  | "percentSigned";

const formatters: Record<FormatKind, (n: number) => string> = {
  money: (n) => formatMoney(n),
  moneyCompact: (n) => formatMoney(n, "INR", { compact: true }),
  moneyCompactSigned: (n) => formatMoney(n, "INR", { compact: true, signed: true }),
  percent: (n) => formatPercent(n),
  percentSigned: (n) => formatPercent(n, { signed: true }),
};

// Animated number that counts up on mount.
//
// The text is written straight to the node rather than rendered from a
// MotionValue child: that pattern silently stops updating under React 19, which
// left every headline figure frozen at its start value of ₹0. Rendering
// `fmt(value)` as the child also means the real number is in the server HTML,
// so the card is correct even if the animation never runs.
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: FormatKind;
  className?: string;
}) {
  const fmt = formatters[format];
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);

  useEffect(() => {
    const controls = animate(from.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (n) => {
        from.current = n;
        if (ref.current) ref.current.textContent = fmt(n);
      },
    });
    return () => controls.stop();
  }, [value, fmt]);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {fmt(value)}
    </span>
  );
}

export function StatCard({
  label,
  value,
  format,
  sub,
  tone,
}: {
  label: string;
  value: number;
  format: FormatKind;
  sub?: React.ReactNode;
  tone?: "positive" | "negative";
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <CardLabel>{label}</CardLabel>
      <AnimatedNumber
        value={value}
        format={format}
        className={cn(
          "text-2xl font-semibold tracking-tight",
          tone === "positive" && "text-[var(--positive)]",
          tone === "negative" && "text-[var(--negative)]",
        )}
      />
      {sub && <div className="text-xs text-[var(--fg-muted)]">{sub}</div>}
    </Card>
  );
}
