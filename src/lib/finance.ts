import type {
  AssetClass,
  Holding,
  Liability,
  NetWorthPoint,
  Transaction,
} from "./types";

export interface PortfolioSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  invested: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
  dayChange: number;
  dayChangePct: number;
  cash: number;
  passiveIncome: number; // annual
  emergencyMonths: number; // cash / assumed monthly need
}

export function summarize(
  holdings: Holding[],
  liabilities: Liability[],
  monthlyExpense = 100_000,
): PortfolioSummary {
  let currentValue = 0;
  let invested = 0;
  let dayChange = 0;
  let cash = 0;
  let passiveIncome = 0;

  for (const h of holdings) {
    currentValue += h.currentValue;
    invested += h.investedAmount;
    dayChange += h.dayChange ?? 0;
    passiveIncome += h.annualIncome ?? 0;
    if (h.assetClass === "cash") cash += h.currentValue;
  }

  const totalLiabilities = liabilities.reduce((s, l) => s + l.outstanding, 0);
  const totalAssets = currentValue;
  const unrealizedGain = currentValue - invested;
  const prevValue = currentValue - dayChange;

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    invested,
    currentValue,
    unrealizedGain,
    unrealizedGainPct: invested > 0 ? (unrealizedGain / invested) * 100 : 0,
    dayChange,
    dayChangePct: prevValue > 0 ? (dayChange / prevValue) * 100 : 0,
    cash,
    passiveIncome,
    emergencyMonths: monthlyExpense > 0 ? cash / monthlyExpense : 0,
  };
}

export interface AllocationSlice {
  key: string;
  value: number;
  pct: number;
}

export function allocateBy(
  holdings: Holding[],
  select: (h: Holding) => string,
): AllocationSlice[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const h of holdings) {
    const k = select(h) || "Unknown";
    map.set(k, (map.get(k) ?? 0) + h.currentValue);
    total += h.currentValue;
  }
  return [...map.entries()]
    .map(([key, value]) => ({ key, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export const assetClassLabel: Record<AssetClass, string> = {
  equity: "Equity",
  debt: "Debt",
  cash: "Cash",
  commodity: "Commodity",
  crypto: "Crypto",
  real_estate: "Real Estate",
  alternative: "Alternative",
  retirement: "Retirement",
  receivable: "Receivable",
};

// CAGR from invested -> current over a period in years.
export function cagr(invested: number, current: number, years: number): number {
  if (invested <= 0 || years <= 0) return 0;
  return (Math.pow(current / invested, 1 / years) - 1) * 100;
}

// XIRR via Newton-Raphson with bisection fallback. Cashflows: outflows negative,
// final portfolio value as a positive flow on the valuation date.
export function xirr(
  flows: { date: string; amount: number }[],
  guess = 0.1,
): number {
  if (flows.length < 2) return 0;
  const t0 = new Date(flows[0].date).getTime();
  const years = (d: string) => (new Date(d).getTime() - t0) / (365 * 24 * 3600 * 1000);

  const npv = (rate: number) =>
    flows.reduce((s, f) => s + f.amount / Math.pow(1 + rate, years(f.date)), 0);
  const dnpv = (rate: number) =>
    flows.reduce(
      (s, f) => s - (years(f.date) * f.amount) / Math.pow(1 + rate, years(f.date) + 1),
      0,
    );

  let rate = guess;
  for (let i = 0; i < 50; i++) {
    const v = npv(rate);
    const d = dnpv(rate);
    if (Math.abs(v) < 1e-6) return rate * 100;
    if (d === 0) break;
    const next = rate - v / d;
    if (!isFinite(next)) break;
    rate = next;
  }

  // Bisection fallback on a bracketed sign change.
  let lo = -0.9999;
  let hi = 10;
  let flo = npv(lo);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fmid = npv(mid);
    if (Math.abs(fmid) < 1e-6) return mid * 100;
    if (flo * fmid < 0) hi = mid;
    else {
      lo = mid;
      flo = fmid;
    }
  }
  return ((lo + hi) / 2) * 100;
}

// Portfolio concentration: largest single-holding share of total value.
export function concentration(holdings: Holding[]): { name: string; pct: number } {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  let top = { name: "—", pct: 0 };
  for (const h of holdings) {
    const pct = total > 0 ? (h.currentValue / total) * 100 : 0;
    if (pct > top.pct) top = { name: h.name, pct };
  }
  return top;
}

// 0..100 health score from diversification, cash buffer, leverage, gains.
export function healthScore(
  s: PortfolioSummary,
  topConcentrationPct: number,
): number {
  const diversification = Math.max(0, 100 - topConcentrationPct * 1.5); // penalise concentration
  const buffer = Math.min(100, (s.emergencyMonths / 6) * 100); // 6 months = full
  const leverage =
    s.totalAssets > 0
      ? Math.max(0, 100 - (s.totalLiabilities / s.totalAssets) * 100)
      : 100;
  const performance = Math.min(100, Math.max(0, 50 + s.unrealizedGainPct));
  return Math.round(
    diversification * 0.3 + buffer * 0.25 + leverage * 0.25 + performance * 0.2,
  );
}

// Build a net-worth series by walking signed transactions backward from today's value.
export function buildNetWorthSeries(
  currentNetWorth: number,
  txns: Transaction[],
): NetWorthPoint[] {
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  const points: NetWorthPoint[] = [{ date: new Date().toISOString().slice(0, 10), value: currentNetWorth }];
  let running = currentNetWorth;
  for (let i = sorted.length - 1; i >= 0; i--) {
    running -= sorted[i].amount;
    points.unshift({ date: sorted[i].date.slice(0, 10), value: running });
  }
  return points;
}
