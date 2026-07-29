"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { formatMoney } from "@/lib/format";
import {
  computeTax,
  gainsByInstalment,
  totalGains,
  classify,
  type Category,
  type Trade,
} from "@/lib/tax/engine";
import {
  readSheets,
  parseTrades,
  parseStatement,
  statementTotals,
  type StatementRow,
} from "@/lib/tax/parse";
import { buildWorkbook, download, type Assessee } from "@/lib/tax/workbook";

const FY = "2025 - 2026";
const AY = "2026 - 2027";
const FY_END_YEAR = 2026;
const PROFILE_KEY = "wealthos:tax-profile:v1";

interface Profile extends Assessee {
  salaryGross: number;
  businessIncome: number;
  savingsInterest: number;
  otherInterest: number;
  dividend: number;
  tds: number;
  advanceTax: [number, number, number, number];
}

const EMPTY: Profile = {
  name: "",
  pan: "",
  fatherName: "",
  address: "",
  status: "INDIVIDUAL",
  assessmentYear: AY,
  financialYear: FY,
  salaryGross: 0,
  businessIncome: 0,
  savingsInterest: 0,
  otherInterest: 0,
  dividend: 0,
  tds: 0,
  advanceTax: [0, 0, 0, 0],
};

export default function TaxPage() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [statement, setStatement] = useState<StatementRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Figures spotted in the statement that must not be used as-is.
  const [seen, setSeen] = useState<{ salary: number; tds: number } | null>(null);

  // Assessee details and manual figures survive a reload; the uploads don't.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      // One-shot hydration from localStorage — reading it during render would
      // desync the prerendered HTML.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setProfile({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* corrupt storage — keep the blank profile */
    }
  }, []);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => {
      const next = { ...p, [key]: value };
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      } catch {
        /* private mode — in-memory only */
      }
      return next;
    });

  async function upload(file: File, kind: "trades" | "statement") {
    setBusy(kind);
    setError(null);
    try {
      const sheets = await readSheets(await file.arrayBuffer());
      if (kind === "trades") {
        const parsed = parseTrades(sheets);
        if (!parsed.length) throw new Error("No buy/sell rows found — check the file has purchase and sale date columns.");
        setTrades(parsed);
      } else {
        const parsed = parseStatement(sheets);
        if (!parsed.length) throw new Error("No credit rows found — check the file has date and credit columns.");
        setStatement(parsed);
        const totals = statementTotals(parsed);
        // Only fill what a bank statement actually settles. Salary credits are net
        // of TDS and the statement never sees salary TDS at all — those two stay
        // manual, with the detected figures shown as hints.
        set("savingsInterest", Math.round(totals.savings_interest));
        set("otherInterest", Math.round(totals.deposit_interest));
        set("dividend", Math.round(totals.dividend));
        setSeen({ salary: Math.round(totals.salary), tds: Math.round(totals.tds) });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setBusy(null);
    }
  }

  // Distinct instruments, so equity/debt can be corrected in one place.
  const instruments = useMemo(() => {
    const map = new Map<string, { count: number; category: Category }>();
    for (const t of trades) {
      const e = map.get(t.name) ?? { count: 0, category: t.category };
      map.set(t.name, { count: e.count + 1, category: t.category });
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [trades]);

  const setCategory = (name: string, category: Category) =>
    setTrades((ts) => ts.map((t) => (t.name === name ? { ...t, category } : t)));

  const tax = useMemo(
    () =>
      computeTax({
        salaryGross: profile.salaryGross,
        businessIncome: profile.businessIncome,
        savingsInterest: profile.savingsInterest,
        otherInterest: profile.otherInterest,
        dividend: profile.dividend,
        gains: totalGains(trades),
        tds: profile.tds,
        advanceTax: profile.advanceTax,
        computationDate: new Date().toISOString().slice(0, 10),
        quarterGains: gainsByInstalment(trades, FY_END_YEAR),
      }),
    [profile, trades],
  );

  const money = (n: number) => <span className="tnum">{formatMoney(n)}</span>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tax Computation</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          AY {AY} · new regime u/s 115BAC. Files are parsed in your browser — nothing is uploaded.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UploadCard
          label="Stock transaction analysis"
          hint="Broker tax P&L with matched buy/sell rows"
          busy={busy === "trades"}
          done={trades.length ? `${trades.length} trades` : null}
          onFile={(f) => upload(f, "trades")}
        />
        <UploadCard
          label="Account statement"
          hint="Bank or broker ledger — interest and dividend credits"
          busy={busy === "statement"}
          done={statement.length ? `${statement.length} credits` : null}
          onFile={(f) => upload(f, "statement")}
        />
      </div>

      {error && (
        <Card className="border-[var(--danger,#ef4444)] text-sm text-[var(--danger,#ef4444)]">{error}</Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <CardLabel>Assessee</CardLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input value={profile.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="PAN">
              <Input
                value={profile.pan}
                onChange={(e) => set("pan", e.target.value.toUpperCase())}
                maxLength={10}
              />
            </Field>
            <Field label="Father's name">
              <Input value={profile.fatherName ?? ""} onChange={(e) => set("fatherName", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={profile.status} onChange={(e) => set("status", e.target.value)}>
                <option>INDIVIDUAL</option>
                <option>HUF</option>
              </Select>
            </Field>
            <Field label="Address">
              <Input value={profile.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Financial year">
              <Input value={FY} disabled />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <CardLabel>Income and taxes paid</CardLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Money
              label="Gross salary"
              value={profile.salaryGross}
              onChange={(v) => set("salaryGross", v)}
              hint={
                seen?.salary
                  ? `${formatMoney(seen.salary)} of salary credits in the statement — that is net of TDS. Enter gross from Form 16.`
                  : undefined
              }
            />
            <Money
              label="TDS deducted"
              value={profile.tds}
              onChange={(v) => set("tds", v)}
              hint={
                seen?.tds
                  ? `${formatMoney(seen.tds)} of TDS debited in the statement — bank TDS only. Salary TDS is in Form 16 / 26AS.`
                  : "From Form 16 / Form 26AS — a bank statement never shows salary TDS."
              }
            />
            <Money
              label="Savings bank interest"
              value={profile.savingsInterest}
              onChange={(v) => set("savingsInterest", v)}
            />
            <Money
              label="Other interest (FD, deposits)"
              value={profile.otherInterest}
              onChange={(v) => set("otherInterest", v)}
            />
            <Money label="Dividend" value={profile.dividend} onChange={(v) => set("dividend", v)} />
            <Money
              label="Business / professional income"
              value={profile.businessIncome}
              onChange={(v) => set("businessIncome", v)}
            />
          </div>
          <CardLabel>Advance tax paid</CardLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["15 Jun", "15 Sep", "15 Dec", "15 Mar"].map((due, i) => (
              <Money
                key={due}
                label={due}
                value={profile.advanceTax[i]}
                onChange={(v) => {
                  const next = [...profile.advanceTax] as Profile["advanceTax"];
                  next[i] = v;
                  set("advanceTax", next);
                }}
              />
            ))}
          </div>
        </Card>
      </div>

      {instruments.length > 0 && (
        <Card className="space-y-3">
          <CardLabel>Instrument classification</CardLabel>
          <p className="text-xs text-[var(--fg-muted)]">
            Debt and liquid instruments pay no STT — their gains are taxed at slab rates whatever the
            holding period. Correct anything the guess got wrong.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {instruments.map(([name, { count, category }]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="flex-1 truncate text-sm" title={name}>
                  {name} <span className="text-[var(--fg-subtle)]">×{count}</span>
                </span>
                <Select
                  className="h-8 w-24 text-xs"
                  value={category}
                  onChange={(e) => setCategory(name, e.target.value as Category)}
                >
                  <option value="equity">Equity</option>
                  <option value="debt">Debt</option>
                </Select>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardLabel>Computation</CardLabel>
          <Button
            disabled={!profile.name || !profile.pan}
            onClick={async () => {
              const blob = await buildWorkbook(profile, tax, trades, statement);
              download(blob, `${profile.pan || "computation"}-${AY.replace(/\s/g, "")}.xlsx`);
            }}
          >
            <Download className="h-4 w-4" /> Download Excel
          </Button>
        </div>

        <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Taxable salary" value={money(tax.taxableSalary)} />
          <Row label="Income from other sources" value={money(tax.otherSources)} />
          <Row label="STCG @ 20% (STT paid)" value={money(tax.gains.stcg111a)} />
          <Row label="STCG at slab (no STT)" value={money(tax.gains.slab)} />
          <Row label="LTCG @ 12.5%" value={money(tax.gains.ltcg112a)} />
          <Row label="Total income (288A)" value={money(tax.totalIncome)} strong />
          <Row label="Tax before surcharge" value={money(tax.taxBeforeSurcharge)} />
          <Row label={`Surcharge @ ${tax.surchargeRate * 100}%`} value={money(tax.surcharge)} />
          <Row label="Cess @ 4%" value={money(tax.cess)} />
          <Row label="Gross tax liability" value={money(tax.grossTaxLiability)} strong />
          <Row label="Less: TDS + advance tax" value={money(tax.tds + tax.advanceTax)} />
          <Row label="Interest 234B / 234C" value={money(tax.interest234B + tax.interest234C)} />
          <Row
            label={tax.taxPayable >= 0 ? "Tax payable (288B)" : "Refund due"}
            value={money(Math.abs(tax.taxPayable))}
            strong
          />
          {(tax.gains.carryForward.shortTerm > 0 || tax.gains.carryForward.longTerm > 0) && (
            <Row
              label="Losses carried forward"
              value={money(tax.gains.carryForward.shortTerm + tax.gains.carryForward.longTerm)}
            />
          )}
        </div>

        <p className="text-xs text-[var(--fg-subtle)]">
          A working sheet, not a filing. Reconcile against Form 26AS and the AIS, and have your CA
          review it before you file.
        </p>
      </Card>

      {trades.length > 0 && <TradePreview trades={trades} />}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 border-b border-[var(--border)] py-1.5 ${
        strong ? "font-semibold" : "text-[var(--fg-muted)]"
      }`}
    >
      <span>{label}</span>
      <span className={strong ? "" : "text-[var(--fg)]"}>{value}</span>
    </div>
  );
}

function Money({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <Field label={label}>
        <Input
          type="number"
          inputMode="decimal"
          value={value || ""}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
      </Field>
      {hint && <p className="text-[11px] leading-snug text-[var(--fg-subtle)]">{hint}</p>}
    </div>
  );
}

function UploadCard({
  label,
  hint,
  busy,
  done,
  onFile,
}: {
  label: string;
  hint: string;
  busy: boolean;
  done: string | null;
  onFile: (f: File) => void;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="mt-0.5 h-5 w-5 text-[var(--brand-2)]" />
        <div className="flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-[var(--fg-muted)]">{hint}</p>
        </div>
      </div>
      <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] text-sm text-[var(--fg-muted)] hover:bg-[var(--surface)]">
        <Upload className="h-4 w-4" />
        {busy ? "Reading…" : done ? `${done} — replace` : "Choose .xlsx"}
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>
    </Card>
  );
}

function TradePreview({ trades }: { trades: Trade[] }) {
  return (
    <Card className="space-y-3">
      <CardLabel>Parsed trades ({trades.length})</CardLabel>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[var(--bg-elevated)] text-left text-[var(--fg-subtle)]">
            <tr>
              <th className="py-1.5 pr-3 font-medium">Instrument</th>
              <th className="py-1.5 pr-3 font-medium">Bought</th>
              <th className="py-1.5 pr-3 font-medium">Sold</th>
              <th className="py-1.5 pr-3 text-right font-medium">Sale</th>
              <th className="py-1.5 pr-3 text-right font-medium">Cost</th>
              <th className="py-1.5 pr-3 text-right font-medium">Gain</th>
              <th className="py-1.5 font-medium">Head</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => {
              const c = classify(t);
              return (
                <tr key={i} className="border-t border-[var(--border)]">
                  <td className="max-w-48 truncate py-1.5 pr-3" title={t.name}>{t.name}</td>
                  <td className="py-1.5 pr-3 tnum">{t.buyDate}</td>
                  <td className="py-1.5 pr-3 tnum">{t.sellDate}</td>
                  <td className="py-1.5 pr-3 text-right tnum">{formatMoney(t.sellValue)}</td>
                  <td className="py-1.5 pr-3 text-right tnum">{formatMoney(c.cost)}</td>
                  <td
                    className={`py-1.5 pr-3 text-right tnum ${
                      c.gain < 0 ? "text-[var(--danger,#ef4444)]" : ""
                    }`}
                  >
                    {formatMoney(c.gain, "INR", { signed: true })}
                  </td>
                  <td className="py-1.5 text-[var(--fg-muted)]">
                    {c.bucket === "ltcg112a" ? "LTCG 12.5%" : c.bucket === "stcg111a" ? "STCG 20%" : "Slab"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
