import { ACCOUNTS } from "./accounts";
import type { Holding, HistoryPoint, NetWorthPoint, Snapshot } from "./types";

export const sortByDate = <T extends { date: string }>(rows: T[]) =>
  [...rows].sort((a, b) => a.date.localeCompare(b.date));

export function latestSnapshot(snapshots: Snapshot[]): Snapshot | null {
  if (snapshots.length === 0) return null;
  return sortByDate(snapshots)[snapshots.length - 1];
}

// Turn the latest snapshot into per-account Holdings for the finance engine.
export function holdingsFromSnapshot(snap: Snapshot | null): Holding[] {
  if (!snap) return [];
  return ACCOUNTS.map((a) => {
    const e = snap.accounts[a.id] ?? { invested: 0, current: 0 };
    return {
      id: a.id,
      name: a.name,
      kind: a.kind,
      assetClass: a.assetClass,
      currency: "INR",
      quantity: 1,
      investedAmount: e.invested,
      currentValue: e.current,
      account: a.name,
      country: a.id === "indmoney" ? "US" : "IN",
      updatedAt: snap.date,
    } satisfies Holding;
  }).filter((h) => h.currentValue !== 0 || h.investedAmount !== 0);
}

const snapTotals = (snap: Snapshot) =>
  Object.values(snap.accounts).reduce(
    (acc, e) => ({ invested: acc.invested + e.invested, current: acc.current + e.current }),
    { invested: 0, current: 0 },
  );

// Merge seeded history with snapshot-derived totals (snapshots win on shared dates).
export function fullHistory(history: HistoryPoint[], snapshots: Snapshot[]): HistoryPoint[] {
  const byDate = new Map<string, HistoryPoint>();
  for (const h of history) byDate.set(h.date, h);
  for (const s of snapshots) {
    const t = snapTotals(s);
    byDate.set(s.date, { date: s.date, value: t.current, invested: t.invested });
  }
  return sortByDate([...byDate.values()]);
}

export const netWorthSeries = (h: HistoryPoint[]): NetWorthPoint[] =>
  h.map(({ date, value }) => ({ date, value }));

// XIRR cashflows: cost-basis increases are cash out, decreases cash in, terminal
// value is today's portfolio. Built from the invested column over time.
export function investedFlows(h: HistoryPoint[]): { date: string; amount: number }[] {
  const rows = h;
  if (rows.length === 0) return [];
  const flows = rows.map((p, i) => {
    const prev = i === 0 ? 0 : rows[i - 1].invested;
    return { date: p.date, amount: -(p.invested - prev) };
  });
  flows.push({ date: rows[rows.length - 1].date, amount: rows[rows.length - 1].value });
  return flows;
}
