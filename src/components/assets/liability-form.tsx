"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { usePortfolio } from "@/lib/store";
import { liabilityKinds } from "@/lib/asset-meta";
import type { Currency, Liability, LiabilityKind } from "@/lib/types";

export function LiabilityForm({ liability, onDone }: { liability?: Liability; onDone: () => void }) {
  const { addLiability, updateLiability, removeLiability } = usePortfolio();
  const [f, setF] = useState({
    name: liability?.name ?? "",
    kind: (liability?.kind ?? "home_loan") as LiabilityKind,
    outstanding: liability?.outstanding ?? 0,
    interestRate: liability?.interestRate ?? 0,
    emi: liability?.emi ?? 0,
    dueDate: liability?.dueDate ?? "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const valid = f.name.trim() !== "" && f.outstanding >= 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const payload = {
      name: f.name.trim(),
      kind: f.kind,
      currency: "INR" as Currency,
      outstanding: Number(f.outstanding) || 0,
      interestRate: Number(f.interestRate) || null,
      emi: Number(f.emi) || null,
      dueDate: f.dueDate || null,
    };
    if (liability) updateLiability(liability.id, payload);
    else addLiability(payload);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name">
        <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Home Loan • HDFC" autoFocus />
      </Field>
      <Field label="Type">
        <Select value={f.kind} onChange={(e) => set("kind", e.target.value as LiabilityKind)}>
          {liabilityKinds.map((k) => (
            <option key={k.kind} value={k.kind}>
              {k.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Outstanding (₹)">
        <Input type="number" value={f.outstanding} onChange={(e) => set("outstanding", +e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Interest rate (%)">
          <Input type="number" step="0.1" value={f.interestRate} onChange={(e) => set("interestRate", +e.target.value)} />
        </Field>
        <Field label="EMI (₹/mo)">
          <Input type="number" value={f.emi} onChange={(e) => set("emi", +e.target.value)} />
        </Field>
      </div>
      <Field label="Next due date">
        <Input type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={!valid} className="flex-1">
          {liability ? "Save changes" : "Add liability"}
        </Button>
        {liability && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              removeLiability(liability.id);
              onDone();
            }}
            className="!text-[var(--negative)]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
