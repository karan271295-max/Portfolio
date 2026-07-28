import { demoHoldings, demoHistory, demoLiabilities, demoTransactions } from "./demo-data";
import { getServerSupabase } from "./supabase/server";
import { demoMode } from "./supabase/config";
import type { Holding, Liability, NetWorthPoint, Transaction } from "./types";

export interface PortfolioData {
  holdings: Holding[];
  liabilities: Liability[];
  transactions: Transaction[];
  history: NetWorthPoint[];
  source: "demo" | "supabase";
}

// Single read path for the whole app. Uses Supabase when configured and the
// user is signed in; otherwise serves the demo portfolio.
export async function loadPortfolio(): Promise<PortfolioData> {
  if (demoMode) {
    return {
      holdings: demoHoldings,
      liabilities: demoLiabilities,
      transactions: demoTransactions,
      history: demoHistory,
      source: "demo",
    };
  }

  const supabase = await getServerSupabase();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !auth?.user) {
    // Not signed in — nothing to show. Real app redirects via middleware.
    return { holdings: [], liabilities: [], transactions: [], history: [], source: "supabase" };
  }

  const [holdings, liabilities, transactions] = await Promise.all([
    supabase.from("holdings").select("*"),
    supabase.from("liabilities").select("*"),
    supabase.from("transactions").select("*").order("date", { ascending: true }),
  ]);

  return {
    holdings: (holdings.data ?? []) as unknown as Holding[],
    liabilities: (liabilities.data ?? []) as unknown as Liability[],
    transactions: (transactions.data ?? []) as unknown as Transaction[],
    history: [],
    source: "supabase",
  };
}
