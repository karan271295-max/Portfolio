import type { AssetClass, AssetKind, LiabilityKind } from "./types";

// Every supported asset kind → its class + display label. Drives the add-asset form.
export const assetKinds: { kind: AssetKind; label: string; assetClass: AssetClass }[] = [
  { kind: "stock", label: "Stock", assetClass: "equity" },
  { kind: "mutual_fund", label: "Mutual Fund", assetClass: "equity" },
  { kind: "etf", label: "ETF", assetClass: "equity" },
  { kind: "gold", label: "Gold", assetClass: "commodity" },
  { kind: "silver", label: "Silver", assetClass: "commodity" },
  { kind: "sgb", label: "Sovereign Gold Bond", assetClass: "commodity" },
  { kind: "fixed_deposit", label: "Fixed Deposit", assetClass: "debt" },
  { kind: "bank_account", label: "Bank Account", assetClass: "cash" },
  { kind: "savings", label: "Savings Account", assetClass: "cash" },
  { kind: "current_account", label: "Current Account", assetClass: "cash" },
  { kind: "cash", label: "Cash", assetClass: "cash" },
  { kind: "epf", label: "EPF", assetClass: "retirement" },
  { kind: "ppf", label: "PPF", assetClass: "retirement" },
  { kind: "nps", label: "NPS", assetClass: "retirement" },
  { kind: "bond", label: "Bond", assetClass: "debt" },
  { kind: "crypto", label: "Crypto", assetClass: "crypto" },
  { kind: "real_estate", label: "Real Estate", assetClass: "real_estate" },
  { kind: "vehicle", label: "Vehicle", assetClass: "alternative" },
  { kind: "private_equity", label: "Private Equity", assetClass: "alternative" },
  { kind: "startup", label: "Startup Investment", assetClass: "alternative" },
  { kind: "business", label: "Business Ownership", assetClass: "alternative" },
  { kind: "insurance_cash_value", label: "Insurance Cash Value", assetClass: "alternative" },
  { kind: "collectible", label: "Collectible", assetClass: "alternative" },
  { kind: "foreign_investment", label: "Foreign Investment", assetClass: "equity" },
  { kind: "loan_given", label: "Loan Given", assetClass: "receivable" },
  { kind: "other", label: "Other Asset", assetClass: "alternative" },
];

export const classForKind = (kind: AssetKind): AssetClass =>
  assetKinds.find((k) => k.kind === kind)?.assetClass ?? "alternative";

export const liabilityKinds: { kind: LiabilityKind; label: string }[] = [
  { kind: "home_loan", label: "Home Loan" },
  { kind: "car_loan", label: "Car Loan" },
  { kind: "education_loan", label: "Education Loan" },
  { kind: "credit_card", label: "Credit Card" },
  { kind: "personal_loan", label: "Personal Loan" },
  { kind: "business_loan", label: "Business Loan" },
  { kind: "other", label: "Other Liability" },
];
