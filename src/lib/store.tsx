"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Liability, HistoryPoint, Snapshot } from "./types";

export interface PortfolioState {
  snapshots: Snapshot[];
  liabilities: Liability[];
  history: HistoryPoint[];
}

/** off = no server configured · on = talking to it · error = configured but unreachable */
export type SyncStatus = "off" | "on" | "error";

interface Store extends PortfolioState {
  persisted: boolean;
  sync: SyncStatus;
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
  const [sync, setSync] = useState<SyncStatus>("off");
  const [retry, setRetry] = useState(0);
  const hydrated = useRef(false);
  // The version token the server gave us, and the document we know it holds.
  const base = useRef<string | null>(null);
  const pushed = useRef<string | null>(null);
  const stateRef = useRef(state);

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

  // Latest state, readable from the wake/pull callbacks without re-subscribing.
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Adopt a document the server handed us, and remember the version it came with.
  const adopt = useCallback((data: unknown, updatedAt: string | null) => {
    if (!valid(data)) return;
    // Take the version token either way, so our own write targets the right row.
    base.current = updatedAt;
    // A document with no entries means the server has nothing real yet. Keep
    // what this device holds and let the push seed it — adopting it would wipe
    // a live portfolio, which is exactly how the two devices drifted apart.
    // ponytail: the cost is that "delete every entry" can't propagate. Cheap
    // next to silently destroying a portfolio.
    if (data.snapshots.length === 0) return;
    pushed.current = JSON.stringify(data);
    setState(data);
  }, []);

  const pull = useCallback(async () => {
    // Never let a refresh discard edits that haven't reached the server yet.
    if (pushed.current !== null && JSON.stringify(stateRef.current) !== pushed.current) return;
    try {
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      const json = await res.json();
      if (!json.sync) return setSync("off");
      adopt(json.data, json.updatedAt ?? null);
      setSync("on");
    } catch {
      // Configured but unreachable — say so instead of silently going local.
      setSync((s) => (s === "on" ? "on" : "error"));
    }
  }, [adopt]);

  useEffect(() => {
    // Async — nothing is set until the network answers.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    pull();
  }, [pull]);

  // A phone that has been backgrounded for hours is holding a stale document.
  // Re-pull when it comes back, and when the network returns — or re-send, if it
  // went to sleep with an edit that never reached the server.
  useEffect(() => {
    const wake = () => {
      if (document.visibilityState !== "visible") return;
      const dirty = pushed.current !== null && JSON.stringify(stateRef.current) !== pushed.current;
      if (dirty) setRetry((n) => n + 1);
      else pull();
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    return () => {
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
    };
  }, [pull]);

  useEffect(() => {
    if (sync !== "on") return;
    const body = JSON.stringify(state);
    if (body === pushed.current) return; // nothing of ours to send
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/portfolio", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ data: state, baseUpdatedAt: base.current }),
        });
        const json = await res.json();
        // 409: another device wrote first. Take theirs rather than overwrite it.
        if (res.status === 409) return adopt(json.data, json.updatedAt ?? null);
        if (json.ok) {
          base.current = json.updatedAt ?? null;
          pushed.current = body;
        }
      } catch {
        /* offline — the next edit or foreground retries */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [state, sync, retry, adopt]);

  const store = useMemo<Store>(
    () => ({
      ...state,
      persisted: persist,
      sync,
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
    [state, persist, sync],
  );

  return <PortfolioContext.Provider value={store}>{children}</PortfolioContext.Provider>;
}
