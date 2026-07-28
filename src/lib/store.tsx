"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Liability, HistoryPoint, Snapshot } from "./types";

export interface PortfolioState {
  snapshots: Snapshot[];
  liabilities: Liability[];
  history: HistoryPoint[];
}

interface Store extends PortfolioState {
  persisted: boolean;
  synced: boolean;
  addSnapshot: (date: string, accounts: Snapshot["accounts"]) => void;
  updateSnapshot: (id: string, date: string, accounts: Snapshot["accounts"]) => void;
  removeSnapshot: (id: string) => void;
  addLiability: (l: Omit<Liability, "id">) => void;
  updateLiability: (id: string, patch: Partial<Liability>) => void;
  removeLiability: (id: string) => void;
}

const KEY = "wealthos:portfolio:v2";
const PortfolioContext = createContext<Store | null>(null);

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

// Only accept stored/synced data that matches the current shape.
const valid = (d: unknown): d is PortfolioState =>
  !!d && typeof d === "object" && Array.isArray((d as PortfolioState).snapshots);

export function PortfolioProvider({
  initial,
  persist,
  children,
}: {
  initial: PortfolioState;
  persist: boolean;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<PortfolioState>(initial);
  const [syncOn, setSyncOn] = useState(false);
  const hydrated = useRef(false);
  const syncReady = useRef(false);

  useEffect(() => {
    if (!persist || hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (valid(parsed)) setState(parsed);
      }
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

  // Pull the server document on mount; it wins for cross-device. Ignore old-shape docs.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/portfolio");
        const json = await res.json();
        if (cancelled) return;
        if (json.sync) {
          if (valid(json.data)) setState(json.data);
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
      addSnapshot: (date, accounts) =>
        setState((s) => ({
          ...s,
          snapshots: [...s.snapshots.filter((x) => x.date !== date), { id: uid(), date, accounts }],
        })),
      updateSnapshot: (id, date, accounts) =>
        setState((s) => ({
          ...s,
          snapshots: s.snapshots.map((x) => (x.id === id ? { ...x, date, accounts } : x)),
        })),
      removeSnapshot: (id) =>
        setState((s) => ({ ...s, snapshots: s.snapshots.filter((x) => x.id !== id) })),
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
