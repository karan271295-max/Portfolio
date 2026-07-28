"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
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
  const mv = useMotionValue(0);
  const text = useTransform(mv, (n) => fmt(n));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [mv, value]);
  return <motion.span className={cn("tnum", className)}>{text}</motion.span>;
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
