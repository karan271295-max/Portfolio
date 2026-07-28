"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Holding, Liability, NetWorthPoint, Transaction } from "./types";

export interface PortfolioState {
  holdings: Holding[];
  liabilities: Liability[];
  transactions: Transaction[];
  history: NetWorthPoint[];
}

interface Store extends PortfolioState {
  persisted: boolean; // true in demo mode (localStorage); false when Supabase-backed
  addHolding: (h: Omit<Holding, "id" | "updatedAt">) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
  addLiability: (l: Omit<Liability, "id">) => void;
  updateLiability: (id: string, patch: Partial<Liability>) => void;
  removeLiability: (id: string) => void;
}

const KEY = "wealthos:portfolio:v1";
const PortfolioContext = createContext<Store | null>(null);

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

export function PortfolioProvider({
  initial,
  persist,
  children,
}: {
  initial: PortfolioState;
  persist: boolean;
  children: React.ReactNode;
}) {
  // In demo mode, prefer a saved localStorage copy over the seed.
  const [state, setState] = useState<PortfolioState>(initial);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!persist || hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* corrupt storage — keep seed */
    }
  }, [persist]);

  useEffect(() => {
    if (!persist || !hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [state, persist]);

  const store = useMemo<Store>(
    () => ({
      ...state,
      persisted: persist,
      addHolding: (h) =>
        setState((s) => ({
          ...s,
          holdings: [{ ...h, id: uid(), updatedAt: new Date().toISOString() }, ...s.holdings],
        })),
      updateHolding: (id, patch) =>
        setState((s) => ({
          ...s,
          holdings: s.holdings.map((h) =>
            h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString() } : h,
          ),
        })),
      removeHolding: (id) =>
        setState((s) => ({ ...s, holdings: s.holdings.filter((h) => h.id !== id) })),
      addLiability: (l) =>
        setState((s) => ({ ...s, liabilities: [{ ...l, id: uid() }, ...s.liabilities] })),
      updateLiability: (id, patch) =>
        setState((s) => ({
          ...s,
          liabilities: s.liabilities.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      removeLiability: (id) =>
        setState((s) => ({ ...s, liabilities: s.liabilities.filter((l) => l.id !== id) })),
    }),
    [state, persist],
  );

  return <PortfolioContext.Provider value={store}>{children}</PortfolioContext.Provider>;
}
