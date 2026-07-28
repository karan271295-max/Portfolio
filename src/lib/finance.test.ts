// Runnable self-check for the finance engine. No framework — `npx tsx src/lib/finance.test.ts`.
import assert from "node:assert";
import { xirr, cagr, summarize, concentration } from "./finance";
import type { Holding, Liability } from "./types";

// CAGR: 100 -> 200 over 2y ≈ 41.42%
assert(Math.abs(cagr(100, 200, 2) - 41.42) < 0.1, "cagr");

// XIRR: invest 1000, get 1100 one year later -> ~10%
const r = xirr([
  { date: "2024-01-01", amount: -1000 },
  { date: "2025-01-01", amount: 1100 },
]);
assert(Math.abs(r - 10) < 0.2, `xirr expected ~10, got ${r}`);

const holdings: Holding[] = [
  {
    id: "1", name: "A", kind: "stock", assetClass: "equity", currency: "INR",
    quantity: 10, investedAmount: 1000, currentValue: 1500, dayChange: 50,
    country: "IN", updatedAt: "", annualIncome: 20,
  },
  {
    id: "2", name: "Bank", kind: "savings", assetClass: "cash", currency: "INR",
    quantity: 1, investedAmount: 500, currentValue: 500, country: "IN", updatedAt: "",
  },
];
const liabs: Liability[] = [
  { id: "l1", name: "Loan", kind: "home_loan", currency: "INR", outstanding: 800 },
];

const s = summarize(holdings, liabs, 100);
assert(s.netWorth === 1200, `netWorth ${s.netWorth}`); // 2000 assets - 800
assert(s.unrealizedGain === 500, "gain");
assert(s.cash === 500, "cash");
assert(s.emergencyMonths === 5, "emergency"); // 500 / 100
assert(concentration(holdings).name === "A", "concentration");

console.log("finance.test: all assertions passed ✓");
