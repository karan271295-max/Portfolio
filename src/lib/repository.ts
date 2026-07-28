import { demoHistory, demoLiabilities, demoSnapshots } from "./demo-data";
import type { HistoryPoint, Liability, Snapshot } from "./types";

export interface PortfolioData {
  snapshots: Snapshot[];
  liabilities: Liability[];
  history: HistoryPoint[];
}

// Local-first seed for the client store. Sync/localStorage take over on the client.
export async function loadPortfolio(): Promise<PortfolioData> {
  return {
    snapshots: demoSnapshots,
    liabilities: demoLiabilities,
    history: demoHistory,
  };
}
