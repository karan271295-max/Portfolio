// Real portfolio seed (imported 23 Jul 2026). Served in demo mode. Finance math is real.
import type { Holding, Liability, NetWorthPoint, Transaction } from "./types";

export const demoHoldings: Holding[] = [
  { id: "h1", name: "Stocks", kind: "stock", assetClass: "equity", currency: "INR", quantity: 1, investedAmount: 3043848, currentValue: 3195290, broker: "Zerodha", account: "Zerodha", country: "IN", updatedAt: "2026-07-23" },
  { id: "h2", name: "Mutual Funds", kind: "mutual_fund", assetClass: "equity", currency: "INR", quantity: 1, investedAmount: 573048, currentValue: 678977, broker: "Zerodha", amc: "Zerodha Coin", account: "Zerodha", country: "IN", updatedAt: "2026-07-23" },
  { id: "h3", name: "Mutual Funds", kind: "mutual_fund", assetClass: "equity", currency: "INR", quantity: 1, investedAmount: 1383000, currentValue: 1788000, broker: "SBI", amc: "SBI", account: "SBI", country: "IN", updatedAt: "2026-07-23" },
  { id: "h4", name: "Stocks", kind: "stock", assetClass: "equity", currency: "INR", quantity: 1, investedAmount: 309893, currentValue: 394258, broker: "INDmoney", account: "INDmoney", country: "IN", updatedAt: "2026-07-23" },
  { id: "h5", name: "Stocks", kind: "stock", assetClass: "equity", currency: "INR", quantity: 1, investedAmount: 86760, currentValue: 89475, broker: "InCred", account: "InCred", country: "IN", updatedAt: "2026-07-23" },
  { id: "h6", name: "Crypto", kind: "crypto", assetClass: "crypto", currency: "INR", quantity: 1, investedAmount: 7837, currentValue: 13967, broker: "WazirX", account: "WazirX", country: "Global", updatedAt: "2026-07-23" },
  { id: "h7", name: "Cash", kind: "cash", assetClass: "cash", currency: "INR", quantity: 1, investedAmount: 250000, currentValue: 250000, account: "Bank", country: "IN", updatedAt: "2026-07-23" },
];

export const demoLiabilities: Liability[] = [];

// Actual net-worth (portfolio value) history from the imported statement.
export const demoHistory: NetWorthPoint[] = [
  { date: "2024-01-04", value: 1744595 },
  { date: "2024-01-16", value: 1865776 },
  { date: "2024-01-29", value: 2170061 },
  { date: "2024-02-15", value: 2226585 },
  { date: "2024-03-02", value: 2284176 },
  { date: "2024-03-11", value: 2295917 },
  { date: "2024-04-02", value: 2391793 },
  { date: "2024-04-24", value: 2441582 },
  { date: "2024-05-21", value: 2511352 },
  { date: "2024-06-21", value: 2627070 },
  { date: "2024-09-21", value: 2939095 },
  { date: "2024-10-21", value: 2970416 },
  { date: "2024-11-21", value: 3117014 },
  { date: "2024-12-21", value: 3232780 },
  { date: "2025-01-21", value: 3184199 },
  { date: "2025-02-21", value: 3138978 },
  { date: "2025-03-24", value: 3330411 },
  { date: "2025-04-21", value: 3427234 },
  { date: "2025-05-21", value: 4662440 },
  { date: "2026-02-05", value: 5405302 },
  { date: "2026-03-29", value: 5524983 },
  { date: "2026-04-29", value: 5855034 },
  { date: "2026-05-23", value: 5505135 },
  { date: "2026-07-23", value: 6409967 },
];

// Investment cashflows derived from the Invested-amount column (real contributions
// and redemptions). Drives XIRR and Recent Activity.
const investedByDate: [string, number][] = [
  ["2024-01-04", 1250444],
  ["2024-01-16", 1335883],
  ["2024-01-29", 1659164],
  ["2024-02-15", 1679083],
  ["2024-03-02", 1724904],
  ["2024-03-11", 1751082],
  ["2024-04-02", 1870414],
  ["2024-04-24", 1891130],
  ["2024-05-21", 1908129],
  ["2024-06-21", 2033691],
  ["2024-09-21", 2139795],
  ["2024-10-21", 2283178],
  ["2024-11-21", 2575235],
  ["2024-12-21", 2635084],
  ["2025-01-21", 2679369],
  ["2025-02-21", 2720708],
  ["2025-03-24", 2837568],
  ["2025-04-21", 2800645],
  ["2025-05-21", 4058381],
  ["2026-02-05", 4672893],
  ["2026-03-29", 5307946],
  ["2026-04-29", 5370375],
  ["2026-05-23", 4793650],
  ["2026-07-23", 5654386],
];

export const demoTransactions: Transaction[] = investedByDate.map(([date, invested], i) => {
  const prev = i === 0 ? 0 : investedByDate[i - 1][1];
  const delta = invested - prev;
  return {
    id: `t${i}`,
    date,
    type: delta >= 0 ? "buy" : "sell",
    amount: delta,
    label: delta >= 0 ? "Net investment" : "Redemption",
  } as Transaction;
});
