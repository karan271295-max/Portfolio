// Demo portfolio — served ONLY when NEXT_PUBLIC_DEMO=true (respects the brief's
// "no fake data unless explicitly enabled"). The finance math run over it is real.
import type { Holding, Liability, Transaction } from "./types";

export const demoHoldings: Holding[] = [
  { id: "h1", name: "Reliance Industries", kind: "stock", assetClass: "equity", currency: "INR", quantity: 120, investedAmount: 280000, currentValue: 356400, sector: "Energy", country: "IN", marketCap: "large", broker: "Zerodha", account: "Zerodha • Kite", dayChange: 4200, annualIncome: 1200, updatedAt: "2026-07-28" },
  { id: "h2", name: "HDFC Bank", kind: "stock", assetClass: "equity", currency: "INR", quantity: 200, investedAmount: 300000, currentValue: 342000, sector: "Financials", country: "IN", marketCap: "large", broker: "Zerodha", account: "Zerodha • Kite", dayChange: -2100, annualIncome: 3800, updatedAt: "2026-07-28" },
  { id: "h3", name: "Parag Parikh Flexi Cap", kind: "mutual_fund", assetClass: "equity", currency: "INR", quantity: 4200, investedAmount: 220000, currentValue: 312000, sector: "Diversified", country: "IN", amc: "PPFAS", account: "MF Central", dayChange: 3100, updatedAt: "2026-07-28" },
  { id: "h4", name: "Nippon Nifty 50 ETF", kind: "etf", assetClass: "equity", currency: "INR", quantity: 900, investedAmount: 180000, currentValue: 208800, sector: "Index", country: "IN", marketCap: "large", broker: "Zerodha", dayChange: 1900, updatedAt: "2026-07-28" },
  { id: "h5", name: "Apple Inc (US)", kind: "foreign_investment", assetClass: "equity", currency: "INR", quantity: 30, investedAmount: 420000, currentValue: 512000, sector: "Technology", country: "US", marketCap: "large", broker: "Vested", dayChange: 6400, annualIncome: 2100, updatedAt: "2026-07-28" },
  { id: "h6", name: "SGB 2023-24 Series III", kind: "sgb", assetClass: "commodity", currency: "INR", quantity: 50, investedAmount: 300000, currentValue: 384500, sector: "Gold", country: "IN", annualIncome: 7500, maturityDate: "2031-12-19", updatedAt: "2026-07-28" },
  { id: "h7", name: "Digital Gold", kind: "gold", assetClass: "commodity", currency: "INR", quantity: 40, investedAmount: 240000, currentValue: 296000, sector: "Gold", country: "IN", dayChange: 1500, updatedAt: "2026-07-28" },
  { id: "h8", name: "SBI Fixed Deposit", kind: "fixed_deposit", assetClass: "debt", currency: "INR", quantity: 1, investedAmount: 500000, currentValue: 536000, country: "IN", annualIncome: 36000, maturityDate: "2026-08-15", account: "SBI", updatedAt: "2026-07-28" },
  { id: "h9", name: "PPF Account", kind: "ppf", assetClass: "retirement", currency: "INR", quantity: 1, investedAmount: 900000, currentValue: 1024000, country: "IN", annualIncome: 71000, account: "SBI PPF", updatedAt: "2026-07-28" },
  { id: "h10", name: "EPF", kind: "epf", assetClass: "retirement", currency: "INR", quantity: 1, investedAmount: 1200000, currentValue: 1418000, country: "IN", annualIncome: 116000, updatedAt: "2026-07-28" },
  { id: "h11", name: "NPS Tier 1", kind: "nps", assetClass: "retirement", currency: "INR", quantity: 1, investedAmount: 600000, currentValue: 742000, country: "IN", account: "NPS", dayChange: 900, updatedAt: "2026-07-28" },
  { id: "h12", name: "Bitcoin", kind: "crypto", assetClass: "crypto", currency: "INR", quantity: 0.15, investedAmount: 400000, currentValue: 651000, country: "Global", broker: "CoinDCX", dayChange: -8200, updatedAt: "2026-07-28" },
  { id: "h13", name: "Ethereum", kind: "crypto", assetClass: "crypto", currency: "INR", quantity: 3, investedAmount: 300000, currentValue: 372000, country: "Global", broker: "CoinDCX", dayChange: 4100, updatedAt: "2026-07-28" },
  { id: "h14", name: "Flat • Whitefield", kind: "real_estate", assetClass: "real_estate", currency: "INR", quantity: 1, investedAmount: 8500000, currentValue: 11200000, sector: "Residential", country: "IN", annualIncome: 360000, updatedAt: "2026-07-28" },
  { id: "h15", name: "HDFC Savings", kind: "savings", assetClass: "cash", currency: "INR", quantity: 1, investedAmount: 385000, currentValue: 385000, country: "IN", account: "HDFC", annualIncome: 11550, updatedAt: "2026-07-28" },
  { id: "h16", name: "Emergency Fund (Liquid MF)", kind: "mutual_fund", assetClass: "cash", currency: "INR", quantity: 1, investedAmount: 450000, currentValue: 468000, country: "IN", amc: "ICICI", account: "MF Central", updatedAt: "2026-07-28" },
  { id: "h17", name: "Angel Startup SAFE", kind: "startup", assetClass: "alternative", currency: "INR", quantity: 1, investedAmount: 500000, currentValue: 750000, sector: "SaaS", country: "IN", updatedAt: "2026-07-28" },
];

export const demoLiabilities: Liability[] = [
  { id: "l1", name: "Home Loan • HDFC", kind: "home_loan", currency: "INR", outstanding: 4200000, interestRate: 8.6, emi: 41000, dueDate: "2026-08-05" },
  { id: "l2", name: "Car Loan • ICICI", kind: "car_loan", currency: "INR", outstanding: 480000, interestRate: 9.2, emi: 14500, dueDate: "2026-08-10" },
  { id: "l3", name: "Credit Cards", kind: "credit_card", currency: "INR", outstanding: 62000, interestRate: 42, dueDate: "2026-08-02" },
];

// Signed monthly flows over ~18 months for the net-worth timeline.
export const demoTransactions: Transaction[] = buildTimeline();

function buildTimeline(): Transaction[] {
  const out: Transaction[] = [];
  const start = new Date("2025-01-01");
  for (let i = 0; i < 18; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const iso = d.toISOString().slice(0, 10);
    out.push({ id: `t-sal-${i}`, date: iso, type: "salary", amount: 320000, label: "Monthly salary" });
    out.push({ id: `t-inv-${i}`, date: iso, type: "buy", amount: 5000 + i * 800, label: "SIP + investments" });
    out.push({ id: `t-exp-${i}`, date: iso, type: "expense", amount: -180000, label: "Living expenses" });
    if (i % 3 === 0) out.push({ id: `t-div-${i}`, date: iso, type: "dividend", amount: 8500, label: "Dividends received" });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
