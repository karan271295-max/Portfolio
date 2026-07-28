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
  { id: "gold", name: "Gold", label: "Commodity", kind: "gold", assetClass: "commodity" },
  { id: "pf", name: "PF", label: "Provident Fund", kind: "epf", assetClass: "retirement" },
  { id: "unlisted", name: "Unlisted Stocks", label: "Private Equity", kind: "private_equity", assetClass: "alternative" },
  { id: "cash", name: "Cash", label: "Cash", kind: "cash", assetClass: "cash", cashLike: true },
];

export const accountById = (id: string) => ACCOUNTS.find((a) => a.id === id);
