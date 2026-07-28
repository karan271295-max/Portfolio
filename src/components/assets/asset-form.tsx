"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { usePortfolio } from "@/lib/store";
import { assetKinds, classForKind } from "@/lib/asset-meta";
import type { AssetKind, Currency, Holding } from "@/lib/types";

const currencies: Currency[] = ["INR", "USD", "EUR", "GBP", "AED"];

export function AssetForm({ holding, onDone }: { holding?: Holding; onDone: () => void }) {
  const { addHolding, updateHolding, removeHolding } = usePortfolio();
  const [f, setF] = useState({
    name: holding?.name ?? "",
    kind: (holding?.kind ?? "stock") as AssetKind,
    currency: (holding?.currency ?? "INR") as Currency,
    quantity: holding?.quantity ?? 1,
    investedAmount: holding?.investedAmount ?? 0,
    currentValue: holding?.currentValue ?? 0,
    sector: holding?.sector ?? "",
    country: holding?.country ?? "IN",
    broker: holding?.broker ?? "",
    account: holding?.account ?? "",
    annualIncome: holding?.annualIncome ?? 0,
    maturityDate: holding?.maturityDate ?? "",
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const valid = f.name.trim() !== "" && f.currentValue >= 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const payload = {
      name: f.name.trim(),
      kind: f.kind,
      assetClass: classForKind(f.kind),
      currency: f.currency,
      quantity: Number(f.quantity) || 1,
      investedAmount: Number(f.investedAmount) || 0,
      currentValue: Number(f.currentValue) || 0,
      sector: f.sector || null,
      country: f.country || "IN",
      broker: f.broker || null,
      account: f.account || null,
      annualIncome: Number(f.annualIncome) || 0,
      maturityDate: f.maturityDate || null,
    };
    if (holding) updateHolding(holding.id, payload);
    else addHolding(payload);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name">
        <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. HDFC Bank" autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={f.kind} onChange={(e) => set("kind", e.target.value as AssetKind)}>
            {assetKinds.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Currency">
          <Select value={f.currency} onChange={(e) => set("currency", e.target.value as Currency)}>
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Invested amount">
          <Input type="number" value={f.investedAmount} onChange={(e) => set("investedAmount", +e.target.value)} />
        </Field>
        <Field label="Current value">
          <Input type="number" value={f.currentValue} onChange={(e) => set("currentValue", +e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity / units">
          <Input type="number" value={f.quantity} onChange={(e) => set("quantity", +e.target.value)} />
        </Field>
        <Field label="Annual income (₹/yr)">
          <Input type="number" value={f.annualIncome} onChange={(e) => set("annualIncome", +e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sector">
          <Input value={f.sector} onChange={(e) => set("sector", e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Country">
          <Input value={f.country} onChange={(e) => set("country", e.target.value)} placeholder="IN" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Broker / platform">
          <Input value={f.broker} onChange={(e) => set("broker", e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Maturity date">
          <Input type="date" value={f.maturityDate} onChange={(e) => set("maturityDate", e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={!valid} className="flex-1">
          {holding ? "Save changes" : "Add asset"}
        </Button>
        {holding && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              removeHolding(holding.id);
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
