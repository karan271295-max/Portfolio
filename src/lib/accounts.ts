import type { AssetClass, AssetKind } from "./types";

// The fixed set of accounts you track. Add/remove here to change the whole app.
export interface Account {
  id: string;
  name: string;
  label: string; // shown under the name
  kind: AssetKind;
  assetClass: AssetClass;
  cashLike?: boolean; // single amount instead of invested + current
}

export const ACCOUNTS: Account[] = [
  { id: "kite", name: "Kite", label: "Equity", kind: "stock", assetClass: "equity" },
  { id: "coin", name: "Coin", label: "Mutual Fund", kind: "mutual_fund", assetClass: "equity" },
  { id: "mfcentral", name: "MF Central", label: "Mutual Fund", kind: "mutual_fund", assetClass: "equity" },
  { id: "indmoney", name: "INDmoney", label: "US Equity", kind: "foreign_investment", assetClass: "equity" },
  { id: "cash", name: "Cash", label: "Cash", kind: "cash", assetClass: "cash", cashLike: true },
];

export const accountById = (id: string) => ACCOUNTS.find((a) => a.id === id);
