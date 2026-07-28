import type { Currency } from "./types";

const symbols: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

// Indian grouping for INR (lakh/crore); western grouping otherwise.
export function formatMoney(
  value: number,
  currency: Currency = "INR",
  opts: { compact?: boolean; signed?: boolean } = {},
): string {
  const sign = value < 0 ? "-" : opts.signed ? "+" : "";
  const abs = Math.abs(value);
  const sym = symbols[currency];

  if (opts.compact) {
    return sign + sym + compact(abs, currency);
  }
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return (
    sign +
    sym +
    abs.toLocaleString(locale, {
      maximumFractionDigits: 0,
    })
  );
}

function compact(abs: number, currency: Currency): string {
  if (currency === "INR") {
    if (abs >= 1e7) return (abs / 1e7).toFixed(2).replace(/\.00$/, "") + "Cr";
    if (abs >= 1e5) return (abs / 1e5).toFixed(2).replace(/\.00$/, "") + "L";
    if (abs >= 1e3) return (abs / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return abs.toFixed(0);
  }
  if (abs >= 1e9) return (abs / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (abs >= 1e6) return (abs / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (abs >= 1e3) return (abs / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return abs.toFixed(0);
}

export function formatPercent(value: number, opts: { signed?: boolean } = {}): string {
  const sign = value > 0 && opts.signed ? "+" : "";
  return sign + value.toFixed(2) + "%";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
