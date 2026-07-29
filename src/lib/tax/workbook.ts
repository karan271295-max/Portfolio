// Writes the computation out as a multi-sheet .xlsx laid out the way a CA's
// computation sheet is: a Computation summary plus one statement per gain bucket.

import {
  classify,
  slabBreakdown,
  STANDARD_DEDUCTION,
  type Trade,
  type TaxResult,
  type Bucket,
} from "./engine";
import { loadExcel, statementTotals, type StatementRow } from "./parse";

export interface Assessee {
  name: string;
  pan: string;
  fatherName?: string;
  address?: string;
  status?: string;
  assessmentYear: string;
  financialYear: string;
}

const MONEY = "#,##0";
const MONEY2 = "#,##0.00";

const ddmmyyyy = (isoDate: string) => isoDate.split("-").reverse().join("/");

const BUCKET_SHEETS: { bucket: Bucket; sheet: string; title: string }[] = [
  {
    bucket: "stcg111a",
    sheet: "STCG 20% (STT Paid)",
    title: "STATEMENT OF SHORT TERM CAPITAL GAIN TAXABLE @ 20% ON LISTED SECURITIES (STT PAID)",
  },
  {
    bucket: "slab",
    sheet: "STCG Slab (No STT)",
    title: "STATEMENT OF SHORT TERM CAPITAL GAIN ON LISTED SECURITIES (NO STT PAID)",
  },
  {
    bucket: "ltcg112a",
    sheet: "LTCG 12.5%",
    title:
      "STATEMENT OF LONG TERM CAPITAL GAIN ON LISTED SECURITIES / UNITS — TAXABLE @ 12.5% (WITHOUT INDEXATION)",
  },
];

export async function buildWorkbook(
  assessee: Assessee,
  tax: TaxResult,
  trades: Trade[],
  statement: StatementRow[],
): Promise<Blob> {
  const Workbook = await loadExcel();
  const wb = new Workbook();
  wb.creator = "WealthOS";
  wb.created = new Date();

  computationSheet(wb.addWorksheet("Computation"), assessee, tax);
  for (const spec of BUCKET_SHEETS) {
    const rows = trades.filter((t) => classify(t).bucket === spec.bucket);
    if (rows.length) gainSheet(wb.addWorksheet(spec.sheet), spec.title, rows);
  }
  if (statement.length) statementSheet(wb.addWorksheet("Other Income"), statement);

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

type Sheet = import("exceljs").Worksheet;

function computationSheet(ws: Sheet, a: Assessee, t: TaxResult) {
  ws.columns = [{ width: 62 }, { width: 16 }, { width: 16 }];

  const line = (label: string, sub?: number | string, amount?: number | string, bold = false) => {
    const row = ws.addRow([label, sub ?? null, amount ?? null]);
    row.font = { bold, size: 10 };
    row.getCell(2).numFmt = MONEY;
    row.getCell(3).numFmt = MONEY;
    row.getCell(2).alignment = { horizontal: "right" };
    row.getCell(3).alignment = { horizontal: "right" };
    return row;
  };
  const heading = (label: string) => {
    ws.addRow([]);
    line(label, undefined, undefined, true);
  };

  line("NAME OF ASSESSEE", undefined, undefined, true).getCell(2).value = a.name;
  line("PAN").getCell(2).value = a.pan;
  if (a.fatherName) line("FATHER'S NAME").getCell(2).value = a.fatherName;
  if (a.address) line("RESIDENTIAL ADDRESS").getCell(2).value = a.address;
  line("STATUS").getCell(2).value = a.status ?? "INDIVIDUAL";
  line("ASSESSMENT YEAR").getCell(2).value = a.assessmentYear;
  line("FINANCIAL YEAR").getCell(2).value = a.financialYear;
  line("OPTED FOR TAXATION U/S 115BAC").getCell(2).value = "YES";
  line("COMPUTATION DATE").getCell(2).value = new Date().toLocaleDateString("en-IN");

  heading("COMPUTATION OF TOTAL INCOME");
  line("SALARIES", undefined, t.taxableSalary);
  line("    GROSS SALARY", t.taxableSalary + STANDARD_DEDUCTION);
  line("    LESS: STANDARD DEDUCTION U/S 16(ia)", STANDARD_DEDUCTION);
  line("    TAXABLE SALARY", t.taxableSalary);
  if (t.businessIncome) line("PROFITS AND GAINS FROM BUSINESS OR PROFESSION", undefined, t.businessIncome);

  const capitalGains = t.gains.slab + t.gains.stcg111a + t.gains.ltcg112a;
  line("CAPITAL GAINS", undefined, capitalGains);
  line("    SHORT TERM CAPITAL GAIN (NO STT — TAXED AT SLAB)", t.gains.slab);
  line("    SHORT TERM CAPITAL GAIN @ 20% ON LISTED SECURITIES (STT PAID)", t.gains.stcg111a);
  line("    LONG TERM CAPITAL GAIN @ 12.5% ON LISTED SECURITIES", t.gains.ltcg112a);

  line("INCOME FROM OTHER SOURCES", undefined, t.otherSources);

  line("GROSS TOTAL INCOME", undefined, t.grossTotalIncome, true);
  line("TOTAL INCOME", undefined, t.grossTotalIncome, true);
  line("TOTAL INCOME ROUNDED OFF U/S 288A", undefined, t.totalIncome, true);

  heading("COMPUTATION OF TAX ON TOTAL INCOME");
  for (const s of slabBreakdown(t.slabBase)) {
    const label =
      s.rate === 0
        ? `TAX ON RS. ${fmt(s.slice)}`
        : `TAX ON RS. ${fmt(s.slice)} (${fmt(s.upto)} - ${fmt(s.from)}) @ ${s.rate * 100}%`;
    line(label, undefined, s.rate === 0 ? "NIL" : Math.round(s.tax));
  }
  line(`TAX ON RS. ${fmt(t.slabBase)}`, undefined, t.slabTax, true);
  if (t.rebate87A) line("LESS: REBATE U/S 87A", undefined, -t.rebate87A);
  if (t.tax111A)
    line(
      `TAX ON SHORT TERM LISTED SECURITIES U/S 111A RS. ${fmt(t.gains.stcg111a)} @ 20%`,
      undefined,
      t.tax111A,
    );
  if (t.tax112A)
    line(
      `TAX U/S 112A @ 12.5% ON LTCG RS. ${fmt(t.ltcgTaxable)} [${fmt(t.gains.ltcg112a)} - 1,25,000 (THRESHOLD LIMIT)]`,
      undefined,
      t.tax112A,
    );
  line("", undefined, t.taxBeforeSurcharge, true);

  if (t.surcharge) line(`ADD: SURCHARGE @ ${t.surchargeRate * 100}%`, undefined, t.surcharge);
  if (t.marginalRelief) line("LESS: MARGINAL RELIEF", undefined, -t.marginalRelief);
  line("ADD: HEALTH AND EDUCATION CESS @ 4%", undefined, t.cess);
  line("", undefined, t.grossTaxLiability, true);

  if (t.tds) line("LESS: TAX DEDUCTED AT SOURCE", t.tds, -t.tds);
  if (t.advanceTax) line("LESS: ADVANCE TAX PAID", t.advanceTax, -t.advanceTax);
  line("", undefined, t.balance, true);

  if (t.interest234B || t.interest234C) {
    line("ADD: INTEREST PAYABLE");
    if (t.interest234B) line("    INTEREST U/S 234B", t.interest234B);
    if (t.interest234C) line("    INTEREST U/S 234C", t.interest234C);
    line("", undefined, t.interest234B + t.interest234C);
  }

  line(t.taxPayable >= 0 ? "TAX PAYABLE" : "REFUND DUE", undefined, Math.abs(t.taxPayable), true);
  line(
    `${t.taxPayable >= 0 ? "TAX PAYABLE" : "REFUND"} ROUNDED OFF U/S 288B`,
    undefined,
    Math.abs(t.taxPayable),
    true,
  );

  const cf = t.gains.carryForward;
  if (cf.shortTerm || cf.longTerm) {
    heading("LOSSES CARRIED FORWARD");
    if (cf.shortTerm) line("SHORT TERM CAPITAL LOSS", undefined, cf.shortTerm);
    if (cf.longTerm) line("LONG TERM CAPITAL LOSS", undefined, cf.longTerm);
  }

  ws.addRow([]);
  ws.addRow([
    "Computed by WealthOS from the uploaded statements. Verify against Form 26AS / AIS before filing.",
  ]).font = { italic: true, size: 9 };
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");

const GAIN_HEADERS = [
  "Name of Company",
  "ISIN",
  "Quantity",
  "Date of Purchase",
  "Date of Sale",
  "Sales Price",
  "Purchase Cost (Deductible)",
  "Transfer Expenses",
  "Capital Gain",
];

function gainSheet(ws: Sheet, title: string, trades: Trade[]) {
  ws.columns = [
    { width: 44 }, { width: 16 }, { width: 10 }, { width: 14 }, { width: 14 },
    { width: 16 }, { width: 20 }, { width: 16 }, { width: 16 },
  ];
  ws.addRow([title]).font = { bold: true, size: 11 };
  ws.addRow([]);

  const header = ws.addRow(GAIN_HEADERS);
  header.font = { bold: true, size: 10 };
  header.alignment = { wrapText: true, vertical: "middle" };

  let sales = 0;
  let cost = 0;
  let gain = 0;
  for (const t of trades) {
    const c = classify(t);
    sales += t.sellValue;
    cost += c.cost;
    gain += c.gain;
    const row = ws.addRow([
      t.name,
      t.isin ?? "",
      t.quantity,
      ddmmyyyy(t.buyDate),
      ddmmyyyy(t.sellDate),
      t.sellValue,
      c.cost,
      t.expenses ?? 0,
      c.gain,
    ]);
    row.font = { size: 10 };
    [6, 7, 8, 9].forEach((i) => (row.getCell(i).numFmt = MONEY2));
  }

  const total = ws.addRow(["Total", "", "", "", "", sales, cost, 0, gain]);
  total.font = { bold: true, size: 10 };
  [6, 7, 8, 9].forEach((i) => (total.getCell(i).numFmt = MONEY2));
  ws.views = [{ state: "frozen", ySplit: 3 }];
}

function statementSheet(ws: Sheet, rows: StatementRow[]) {
  ws.columns = [{ width: 14 }, { width: 62 }, { width: 16 }, { width: 14 }];
  ws.addRow(["INCOME PICKED UP FROM THE ACCOUNT STATEMENT"]).font = { bold: true, size: 11 };
  ws.addRow([]);
  ws.addRow(["Date", "Description", "Credit", "Debit", "Classified as"]).font = { bold: true, size: 10 };

  for (const r of rows) {
    const row = ws.addRow([ddmmyyyy(r.date), r.description, r.credit || null, r.debit || null, r.kind]);
    row.font = { size: 10 };
    row.getCell(3).numFmt = MONEY2;
    row.getCell(4).numFmt = MONEY2;
  }

  ws.addRow([]);
  const totals = statementTotals(rows);
  for (const [kind, sum] of Object.entries(totals)) {
    if (!sum) continue;
    const row = ws.addRow(["", `Total ${kind.replace(/_/g, " ")}`, sum]);
    row.font = { bold: true, size: 10 };
    row.getCell(3).numFmt = MONEY2;
  }
  ws.views = [{ state: "frozen", ySplit: 3 }];
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Revoking synchronously cancels the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
