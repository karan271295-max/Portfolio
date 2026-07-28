"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { usePortfolio } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { ACCOUNTS } from "@/lib/accounts";
import type { AccountEntry, Snapshot } from "@/lib/types";

const blank = () =>
  Object.fromEntries(ACCOUNTS.map((a) => [a.id, { invested: 0, current: 0 }])) as Record<string, AccountEntry>;

export function EntryForm({ snapshot, onDone }: { snapshot?: Snapshot; onDone: () => void }) {
  const { snapshots, addSnapshot, updateSnapshot, removeSnapshot } = usePortfolio();

  // Prefill: editing → that entry; new → latest entry's values as a starting point.
  const latest = snapshots.length ? [...snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1) : undefined;
  const seed = snapshot?.accounts ?? latest?.accounts ?? blank();

  const [date, setDate] = useState(snapshot?.date ?? new Date().toISOString().slice(0, 10));
  const [acc, setAcc] = useState<Record<string, AccountEntry>>(() => ({ ...blank(), ...structuredClone(seed) }));

  const set = (id: string, field: keyof AccountEntry, v: number) =>
    setAcc((s) => {
      const next = { ...s, [id]: { ...s[id], [field]: v } };
      if (ACCOUNTS.find((a) => a.id === id)?.cashLike) next[id] = { invested: v, current: v };
      return next;
    });

  const totalInvested = Object.values(acc).reduce((n, e) => n + e.invested, 0);
  const totalCurrent = Object.values(acc).reduce((n, e) => n + e.current, 0);
  const gain = totalCurrent - totalInvested;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    if (snapshot) updateSnapshot(snapshot.id, date, acc);
    else addSnapshot(date, acc);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Date">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} autoFocus />
      </Field>

      <div className="space-y-3">
        {ACCOUNTS.map((a) => (
          <div key={a.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-[var(--fg-subtle)]">{a.label}</p>
              </div>
            </div>
            {a.cashLike ? (
              <Field label="Amount">
                <Input type="number" value={acc[a.id].current || ""} onChange={(e) => set(a.id, "current", +e.target.value)} />
              </Field>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Invested">
                  <Input type="number" value={acc[a.id].invested || ""} onChange={(e) => set(a.id, "invested", +e.target.value)} />
                </Field>
                <Field label="Today">
                  <Input type="number" value={acc[a.id].current || ""} onChange={(e) => set(a.id, "current", +e.target.value)} />
                </Field>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--surface)] px-3 py-2 text-sm">
        <span className="text-[var(--fg-muted)]">Total</span>
        <span className="tnum">
          {formatMoney(totalCurrent, "INR", { compact: true })}{" "}
          <span className={gain >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
            ({formatMoney(gain, "INR", { compact: true, signed: true })})
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" className="flex-1">
          {snapshot ? "Save entry" : "Add entry"}
        </Button>
        {snapshot && (
          <Button
            type="button"
            variant="secondary"
            className="!text-[var(--negative)]"
            onClick={() => {
              removeSnapshot(snapshot.id);
              onDone();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
