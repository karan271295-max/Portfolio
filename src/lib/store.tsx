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
  persisted: boolean; // localStorage cache active
  synced: boolean; // cross-device sync via /api/portfolio active
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
  // Prefer a saved localStorage copy over the seed.
  const [state, setState] = useState<PortfolioState>(initial);
  const [syncOn, setSyncOn] = useState(false);
  const hydrated = useRef(false);
  const syncReady = useRef(false);

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

  // Pull the server document on mount. If sync is on and the server has data,
  // it wins (that's how a second device sees your portfolio). Empty server ->
  // the current state gets pushed up below. Offline / no keys -> local only.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/portfolio");
        const json = await res.json();
        if (cancelled) return;
        if (json.sync) {
          if (json.data) setState(json.data);
          setSyncOn(true);
        }
      } catch {
        /* offline — keep local */
      } finally {
        syncReady.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced push of the full document whenever it changes.
  useEffect(() => {
    if (!syncOn || !syncReady.current) return;
    const t = setTimeout(() => {
      fetch("/api/portfolio", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [state, syncOn]);

  const store = useMemo<Store>(
    () => ({
      ...state,
      persisted: persist,
      synced: syncOn,
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
    [state, persist, syncOn],
  );

  return <PortfolioContext.Provider value={store}>{children}</PortfolioContext.Provider>;
}
