// Income-tax computation engine — FY 2025-26 (AY 2026-27), new regime u/s 115BAC.
// Pure functions: trades in, capital-gain buckets out, tax out. No I/O.
//
// ponytail: only the new regime + this one FY. Old regime / other years would need
// a slab table per year — add when a second year is actually needed.

export type Category = "equity" | "debt";

/** One matched buy→sell pair, as brokers' tax P&L files already provide them. */
export interface Trade {
  name: string;
  isin?: string;
  quantity: number;
  buyDate: string; // ISO yyyy-mm-dd
  sellDate: string; // ISO yyyy-mm-dd
  buyValue: number; // total cost of acquisition
  sellValue: number; // total sale consideration
  expenses?: number; // transfer expenses
  fmv2018?: number; // total FMV on 31-Jan-2018 (grandfathering), if the file has it
  category: Category; // equity = STT paid; debt = no STT, taxed at slab
}

/** The three rate buckets a capital gain can land in. */
export interface Gains {
  slab: number; // STCG with no STT (debt/liquid) — added to normal income
  stcg111a: number; // STCG on STT-paid listed securities — 20%
  ltcg112a: number; // LTCG on listed securities/units — 12.5% over ₹1.25L
}

export const ZERO_GAINS: Gains = { slab: 0, stcg111a: 0, ltcg112a: 0 };

export type Bucket = keyof Gains;

const GRANDFATHER_CUTOFF = "2018-02-01";
const LTCG_EXEMPTION = 125_000;
export const STANDARD_DEDUCTION = 75_000;

const SLABS: [limit: number, rate: number][] = [
  [400_000, 0],
  [800_000, 0.05],
  [1_200_000, 0.1],
  [1_600_000, 0.15],
  [2_000_000, 0.2],
  [2_400_000, 0.25],
  [Infinity, 0.3],
];

// Surcharge slabs on total income. 115BAC caps the top rate at 25%.
const SURCHARGE: [threshold: number, rate: number][] = [
  [20_000_000, 0.25],
  [10_000_000, 0.15],
  [5_000_000, 0.1],
];
// Surcharge on tax attributable to 111A/112A income is capped at 15%.
const SPECIAL_SURCHARGE_CAP = 0.15;

/** Sale is long-term if held for more than 12 months. */
export function isLongTerm(buyDate: string, sellDate: string): boolean {
  const anniversary = new Date(buyDate);
  anniversary.setMonth(anniversary.getMonth() + 12);
  return new Date(sellDate) > anniversary;
}

/** Deductible cost: grandfathered to 31-Jan-2018 FMV for pre-Feb-2018 equity buys. */
export function deductibleCost(t: Trade): number {
  if (t.category !== "equity" || !t.fmv2018 || t.buyDate >= GRANDFATHER_CUTOFF) return t.buyValue;
  return Math.max(t.buyValue, Math.min(t.fmv2018, t.sellValue));
}

export function classify(t: Trade): { bucket: Bucket; cost: number; gain: number } {
  const cost = deductibleCost(t);
  const gain = t.sellValue - cost - (t.expenses ?? 0);
  // Debt/no-STT: always slab rate post-Apr-2023, whatever the holding period.
  const bucket: Bucket =
    t.category === "debt" ? "slab" : isLongTerm(t.buyDate, t.sellDate) ? "ltcg112a" : "stcg111a";
  return { bucket, cost, gain };
}

/** Raw (pre-set-off) totals per bucket. */
export function totalGains(trades: Trade[]): Gains {
  const g = { ...ZERO_GAINS };
  for (const t of trades) {
    const { bucket, gain } = classify(t);
    g[bucket] += gain;
  }
  return g;
}

export interface SetOff extends Gains {
  carryForward: { shortTerm: number; longTerm: number };
}

/**
 * Set off capital losses. Short-term losses go against any capital gain,
 * long-term losses only against long-term gains. Losses are applied to the
 * highest-taxed bucket first (slab 30% > 111A 20% > 112A 12.5%).
 */
export function setOff(raw: Gains): SetOff {
  const b: Gains = { ...raw };
  let stLoss = 0;
  let ltLoss = 0;

  for (const k of ["slab", "stcg111a"] as const) {
    if (b[k] < 0) {
      stLoss += -b[k];
      b[k] = 0;
    }
  }
  if (b.ltcg112a < 0) {
    ltLoss = -b.ltcg112a;
    b.ltcg112a = 0;
  }

  // Long-term loss can only touch the long-term bucket — apply it first.
  const useLt = Math.min(ltLoss, b.ltcg112a);
  b.ltcg112a -= useLt;
  ltLoss -= useLt;

  for (const k of ["slab", "stcg111a", "ltcg112a"] as const) {
    const use = Math.min(stLoss, b[k]);
    b[k] -= use;
    stLoss -= use;
  }

  return { ...b, carryForward: { shortTerm: stLoss, longTerm: ltLoss } };
}

export interface TaxInput {
  salaryGross: number;
  businessIncome: number;
  savingsInterest: number;
  otherInterest: number;
  dividend: number;
  gains: Gains; // raw, pre-set-off
  tds: number;
  /** Advance tax paid by each due date: 15 Jun, 15 Sep, 15 Dec, 15 Mar. */
  advanceTax: [number, number, number, number];
  /** Date the tax is being computed/paid on — drives 234B months. */
  computationDate: string;
  /** Raw gains realised on or before each 234C due date (proviso relief). */
  quarterGains?: [Gains, Gains, Gains, Gains];
}

export interface TaxResult {
  taxableSalary: number;
  businessIncome: number;
  otherSources: number;
  gains: SetOff;
  normalIncome: number; // taxed at slab
  grossTotalIncome: number;
  totalIncome: number; // rounded u/s 288A
  slabBase: number;
  slabTax: number;
  rebate87A: number;
  tax111A: number;
  ltcgTaxable: number;
  tax112A: number;
  taxBeforeSurcharge: number;
  surchargeRate: number;
  surcharge: number;
  marginalRelief: number;
  cess: number;
  grossTaxLiability: number;
  tds: number;
  advanceTax: number;
  balance: number;
  interest234B: number;
  interest234C: number;
  taxPayable: number; // rounded u/s 288B (negative = refund)
}

const r0 = Math.round;
const floor100 = (x: number) => Math.floor(x / 100) * 100;
const round10 = (x: number) => Math.round(x / 10) * 10;

function slabTaxOn(income: number): number {
  return slabBreakdown(income).reduce((s, x) => s + x.tax, 0);
}

/** Per-slab detail, so the exported sheet can show the same lines a CA's does. */
export function slabBreakdown(income: number) {
  const out: { slice: number; from: number; upto: number; rate: number; tax: number }[] = [];
  let prev = 0;
  for (const [limit, rate] of SLABS) {
    if (income <= prev) break;
    const upto = Math.min(income, limit);
    out.push({ slice: upto - prev, from: prev, upto, rate, tax: (upto - prev) * rate });
    prev = limit;
  }
  return out;
}

/** Whole months between two dates, any part of a month counting as a full one. */
export function monthsBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() > from.getDate()) m += 1;
  return Math.max(0, m);
}

/** Everything up to and including cess — no TDS, no interest. Reused by 234C. */
function liability(input: Omit<TaxInput, "advanceTax" | "computationDate" | "quarterGains">) {
  const taxableSalary = Math.max(0, input.salaryGross - STANDARD_DEDUCTION);
  const otherSources = input.savingsInterest + input.otherInterest + input.dividend;
  const gains = setOff(input.gains);

  const normalIncome = taxableSalary + input.businessIncome + gains.slab + otherSources;
  const grossTotalIncome = normalIncome + gains.stcg111a + gains.ltcg112a;
  const totalIncome = round10(grossTotalIncome);
  const slabBase = totalIncome - gains.stcg111a - gains.ltcg112a;

  const slabTaxRaw = slabTaxOn(slabBase);
  // 87A: full rebate up to ₹12L of slab income, then marginal relief. Never
  // available against 111A/112A income.
  const rebate87A =
    slabBase <= 1_200_000
      ? Math.min(slabTaxRaw, 60_000)
      : Math.max(0, slabTaxRaw - (slabBase - 1_200_000));

  const slabTax = r0(slabTaxRaw);
  const tax111A = r0(gains.stcg111a * 0.2);
  const ltcgTaxable = Math.max(0, gains.ltcg112a - LTCG_EXEMPTION);
  const tax112A = r0(ltcgTaxable * 0.125);

  const slabTaxNet = Math.max(0, slabTax - r0(rebate87A));
  const specialTax = tax111A + tax112A;
  const taxBeforeSurcharge = slabTaxNet + specialTax;

  const surchargeRate = SURCHARGE.find(([t]) => totalIncome > t)?.[1] ?? 0;
  const surcharge = r0(
    slabTaxNet * surchargeRate + specialTax * Math.min(surchargeRate, SPECIAL_SURCHARGE_CAP),
  );

  // Marginal relief: surcharge cannot push (tax + surcharge) above the tax at the
  // threshold plus every rupee of income over it.
  // ponytail: tax at the threshold is computed on slab rates only; exact enough
  // while special-rate income is a minority of total income.
  let marginalRelief = 0;
  if (surchargeRate > 0) {
    const threshold = SURCHARGE.find(([t]) => totalIncome > t)![0];
    const capped = r0(slabTaxOn(threshold)) + (totalIncome - threshold);
    marginalRelief = Math.max(0, taxBeforeSurcharge + surcharge - capped);
  }

  const cess = r0((taxBeforeSurcharge + surcharge - marginalRelief) * 0.04);
  const grossTaxLiability = taxBeforeSurcharge + surcharge - marginalRelief + cess;

  return {
    taxableSalary,
    businessIncome: input.businessIncome,
    otherSources,
    gains,
    normalIncome,
    grossTotalIncome,
    totalIncome,
    slabBase,
    slabTax,
    rebate87A: r0(rebate87A),
    tax111A,
    ltcgTaxable,
    tax112A,
    taxBeforeSurcharge,
    surchargeRate,
    surcharge,
    marginalRelief,
    cess,
    grossTaxLiability,
  };
}

// 234C: cumulative % due by each date, and months of interest on a shortfall.
// The first two dates carry a relaxed threshold (no interest at 12% / 36%).
const INSTALMENTS = [
  { due: "06-15", required: 0.15, safe: 0.12, months: 3 },
  { due: "09-15", required: 0.45, safe: 0.36, months: 3 },
  { due: "12-15", required: 0.75, safe: 0.75, months: 3 },
  { due: "03-15", required: 1.0, safe: 1.0, months: 1 },
];

export function computeTax(input: TaxInput): TaxResult {
  const base = liability(input);
  const advanceTax = input.advanceTax.reduce((s, x) => s + x, 0);
  const assessedTax = Math.max(0, base.grossTaxLiability - input.tds);
  const balance = base.grossTaxLiability - input.tds - advanceTax;

  // 234B — advance tax under 90% of assessed tax, from 1 Apr of the AY.
  const fyEndYear = new Date(input.computationDate).getFullYear();
  let interest234B = 0;
  if (advanceTax < 0.9 * assessedTax && balance > 0) {
    const months = monthsBetween(`${fyEndYear}-04-01`, input.computationDate);
    interest234B = floor100(balance) * 0.01 * months;
  }

  // 234C — shortfall against each instalment. Capital gains realised after a due
  // date are excluded from that instalment's target (proviso to s.234C).
  let interest234C = 0;
  let paid = 0;
  INSTALMENTS.forEach((inst, i) => {
    paid += input.advanceTax[i];
    const gains = input.quarterGains?.[i] ?? input.gains;
    const upto = Math.max(0, liability({ ...input, gains }).grossTaxLiability - input.tds);
    // The proviso can only shrink an instalment's target, never raise it above
    // the tax actually due on the returned income.
    const due = Math.min(assessedTax, upto);
    if (paid >= inst.safe * due) return;
    const shortfall = inst.required * due - paid;
    if (shortfall > 0) interest234C += floor100(shortfall) * 0.01 * inst.months;
  });

  const taxPayable = balance + r0(interest234B) + r0(interest234C);

  return {
    ...base,
    tds: input.tds,
    advanceTax,
    balance: r0(balance),
    interest234B: r0(interest234B),
    interest234C: r0(interest234C),
    taxPayable: round10(taxPayable),
  };
}

/** Raw gains realised on or before each 234C due date, for the proviso relief. */
export function gainsByInstalment(trades: Trade[], fyEndYear: number): [Gains, Gains, Gains, Gains] {
  return INSTALMENTS.map((inst) => {
    const year = inst.due.startsWith("03") ? fyEndYear : fyEndYear - 1;
    const cutoff = `${year}-${inst.due}`;
    return totalGains(trades.filter((t) => t.sellDate <= cutoff));
  }) as [Gains, Gains, Gains, Gains];
}
