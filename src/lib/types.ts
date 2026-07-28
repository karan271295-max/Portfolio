// Core domain types for WealthOS — the Net Worth Operating System.

export type AssetClass =
  | "equity" // stocks, ETF, equity MF
  | "debt" // bonds, FD, PPF, EPF debt portion
  | "cash" // bank, savings, current, cash
  | "commodity" // gold, silver, SGB
  | "crypto"
  | "real_estate"
  | "alternative" // PE, startups, business, collectibles, insurance cash value
  | "retirement" // NPS, EPF, PPF
  | "receivable"; // loans given

// Granular instrument kind (drives icons, parsing, market-data source).
export type AssetKind =
  | "stock"
  | "mutual_fund"
  | "etf"
  | "gold"
  | "silver"
  | "sgb"
  | "fixed_deposit"
  | "bank_account"
  | "savings"
  | "current_account"
  | "cash"
  | "epf"
  | "ppf"
  | "nps"
  | "bond"
  | "crypto"
  | "real_estate"
  | "vehicle"
  | "private_equity"
  | "startup"
  | "business"
  | "insurance_cash_value"
  | "collectible"
  | "foreign_investment"
  | "loan_given"
  | "other";

export type LiabilityKind =
  | "home_loan"
  | "car_loan"
  | "education_loan"
  | "credit_card"
  | "personal_loan"
  | "business_loan"
  | "other";

export type Currency = "INR" | "USD" | "EUR" | "GBP" | "AED";

export interface Holding {
  id: string;
  name: string;
  kind: AssetKind;
  assetClass: AssetClass;
  currency: Currency;
  quantity: number; // units / shares; 1 for lump-sum assets
  investedAmount: number; // cost basis, base currency
  currentValue: number; // latest mark, base currency
  sector?: string | null;
  country?: string; // ISO code, default "IN"
  marketCap?: "large" | "mid" | "small" | null;
  amc?: string | null; // fund house
  broker?: string | null;
  account?: string | null;
  goalId?: string | null;
  taxCategory?: string | null;
  dayChange?: number; // absolute base-currency change today
  annualIncome?: number; // dividends/interest/rent per year (passive income)
  maturityDate?: string | null; // ISO, for FD/bonds
  updatedAt: string;
}

export interface Liability {
  id: string;
  name: string;
  kind: LiabilityKind;
  currency: Currency;
  outstanding: number; // base currency
  interestRate?: number | null; // annual %
  emi?: number | null;
  dueDate?: string | null;
}

export type TxnType =
  | "buy"
  | "sell"
  | "salary"
  | "dividend"
  | "interest"
  | "rent"
  | "deposit"
  | "withdrawal"
  | "expense"
  | "gift"
  | "inheritance"
  | "loan"
  | "property_purchase";

export interface Transaction {
  id: string;
  date: string; // ISO
  type: TxnType;
  amount: number; // signed, base currency (+ inflow / - outflow to net worth)
  label: string;
  holdingId?: string | null;
  category?: string | null;
  broker?: string | null;
  source?: string | null;
  tags?: string[];
  note?: string | null;
}

export interface NetWorthPoint {
  date: string; // ISO date
  value: number;
}

// A dated entry: invested + current value per account. The core record now.
export interface AccountEntry {
  invested: number;
  current: number;
}

export interface Snapshot {
  id: string;
  date: string; // ISO date
  accounts: Record<string, AccountEntry>; // keyed by Account.id
}

// Historical totals (portfolio value + cost basis) for the chart and XIRR.
export interface HistoryPoint {
  date: string;
  value: number; // portfolio value
  invested: number; // cost basis
}
