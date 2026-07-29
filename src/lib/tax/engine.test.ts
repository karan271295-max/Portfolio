// Runnable self-check for the tax engine. `npx tsx src/lib/tax/engine.test.ts`
// Reference case: the CA's AY 2026-27 computation, reproduced line for line.
import assert from "node:assert";
import { classify, isLongTerm, setOff, computeTax, monthsBetween, type Trade } from "./engine";

const near = (a: number, b: number, tol = 1, what = "") =>
  assert(Math.abs(a - b) <= tol, `${what}: expected ${b}, got ${a}`);

// --- holding period ---------------------------------------------------------
assert(!isLongTerm("2025-03-26", "2026-03-23"), "362 days is short term");
assert(isLongTerm("2020-08-12", "2025-06-06"), "5 years is long term");
assert(!isLongTerm("2024-04-01", "2025-04-01"), "exactly 12 months is short term");
assert(isLongTerm("2024-04-01", "2025-04-02"), "12 months + 1 day is long term");

// --- classification ---------------------------------------------------------
const equity: Trade = {
  name: "HYUNDAI", quantity: 1, buyDate: "2024-10-21", sellDate: "2025-08-21",
  buyValue: 1960, sellValue: 2513.4, category: "equity",
};
assert(classify(equity).bucket === "stcg111a", "STT-paid short term");
near(classify(equity).gain, 553.4, 0.01, "gain");

const liquid: Trade = { ...equity, name: "LIQUIDCASE", category: "debt", buyDate: "2020-01-01" };
assert(classify(liquid).bucket === "slab", "no-STT debt always slab");

// Grandfathering: pre-Feb-2018 buy, cost stepped up to 31-Jan-2018 FMV.
const old: Trade = {
  name: "OLD", quantity: 1, buyDate: "2015-01-01", sellDate: "2025-01-01",
  buyValue: 100, sellValue: 500, fmv2018: 300, category: "equity",
};
near(classify(old).gain, 200, 0.01, "grandfathered gain");

// --- loss set-off -----------------------------------------------------------
// Short-term loss eats the highest-rate bucket first.
const s = setOff({ slab: -50_000, stcg111a: 30_000, ltcg112a: 40_000 });
assert(s.slab === 0 && s.stcg111a === 0 && s.ltcg112a === 20_000, "ST loss set-off order");
assert(s.carryForward.shortTerm === 0, "nothing left to carry");
// Long-term loss cannot touch short-term gains.
const l = setOff({ slab: 0, stcg111a: 50_000, ltcg112a: -20_000 });
assert(l.stcg111a === 50_000 && l.carryForward.longTerm === 20_000, "LT loss stays long term");

// --- months -----------------------------------------------------------------
assert(monthsBetween("2026-04-01", "2026-07-29") === 4, "Apr 1 to Jul 29 is 4 months");
assert(monthsBetween("2026-04-01", "2026-04-01") === 0, "same day is 0 months");

// --- full computation: the reference CA sheet -------------------------------
const t = computeTax({
  salaryGross: 4_800_000,
  businessIncome: 4_322,
  savingsInterest: 4_389,
  otherInterest: 1_08_044,
  dividend: 18_267,
  gains: { slab: 9_895.26, stcg111a: 4_879.02, ltcg112a: 2_87_276.78 },
  tds: 10_50_807,
  advanceTax: [0, 0, 0, 0],
  computationDate: "2026-07-29",
});

near(t.taxableSalary, 47_25_000, 0, "taxable salary");
near(t.otherSources, 1_30_700, 0, "income from other sources");
near(t.grossTotalIncome, 51_62_073, 1, "gross total income");
near(t.totalIncome, 51_62_070, 0, "total income u/s 288A");
near(t.slabBase, 48_69_914, 1, "slab base");
near(t.slabTax, 10_40_974, 1, "slab tax");
near(t.rebate87A, 0, 0, "no 87A rebate at this income");
near(t.tax111A, 976, 0, "111A @ 20%");
near(t.ltcgTaxable, 1_62_277, 1, "LTCG over the 1.25L threshold");
near(t.tax112A, 20_285, 0, "112A @ 12.5%");
near(t.taxBeforeSurcharge, 10_62_235, 1, "tax before surcharge");
assert(t.surchargeRate === 0.1, "10% surcharge over 50L");
near(t.surcharge, 1_06_224, 1, "surcharge");
near(t.marginalRelief, 0, 0, "no marginal relief at 51.6L");
near(t.cess, 46_738, 1, "4% cess");
near(t.grossTaxLiability, 12_15_197, 1, "gross tax liability");
near(t.balance, 1_64_390, 1, "balance after TDS");
near(t.interest234B, 6_572, 1, "234B");

// 234C never charges more than the tax actually due: gains realised mid-year and
// wiped out by a later loss leave nothing to have paid advance tax on.
const wiped = computeTax({
  salaryGross: 0, businessIncome: 0, savingsInterest: 0, otherInterest: 0, dividend: 0,
  gains: { slab: 0, stcg111a: -8_959, ltcg112a: 7_284 },
  tds: 0, advanceTax: [0, 0, 0, 0], computationDate: "2026-07-29",
  quarterGains: [
    { slab: 0, stcg111a: 0, ltcg112a: 7_284 },
    { slab: 0, stcg111a: 2_766, ltcg112a: 7_284 },
    { slab: 0, stcg111a: 2_766, ltcg112a: 7_284 },
    { slab: 0, stcg111a: 2_766, ltcg112a: 7_284 },
  ],
});
near(wiped.interest234C, 0, 0, "234C capped at the tax due on returned income");

// --- 87A rebate + its marginal relief ---------------------------------------
const small = (salary: number) =>
  computeTax({
    salaryGross: salary, businessIncome: 0, savingsInterest: 0, otherInterest: 0,
    dividend: 0, gains: { slab: 0, stcg111a: 0, ltcg112a: 0 }, tds: 0,
    advanceTax: [0, 0, 0, 0], computationDate: "2026-07-29",
  });
near(small(12_75_000).grossTaxLiability, 0, 0, "12L after standard deduction is fully rebated");
// 13L salary → 12.25L slab income; tax is capped at the ₹25,000 over the 12L line.
near(small(13_00_000).taxBeforeSurcharge, 25_000, 1, "87A marginal relief");

console.log("tax/engine.test: all assertions passed ✓");
