import { demoHoldings, demoHistory, demoLiabilities, demoTransactions } from "./demo-data";
import type { Holding, Liability, NetWorthPoint, Transaction } from "./types";

export interface PortfolioData {
  holdings: Holding[];
  liabilities: Liability[];
  transactions: Transaction[];
  history: NetWorthPoint[];
}

// Local-only personal tool: no auth, no backend. Seeds the client store with the
// imported portfolio; edits then live in the browser (localStorage). Swap the seed
// or wire a cloud store here later if cross-device sync is ever needed.
export async function loadPortfolio(): Promise<PortfolioData> {
  return {
    holdings: demoHoldings,
    liabilities: demoLiabilities,
    transactions: demoTransactions,
    history: demoHistory,
  };
}
