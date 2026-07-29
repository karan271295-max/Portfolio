// Excel readers for the two inputs: a broker's stock transaction analysis
// (matched buy→sell rows) and a bank/broker account statement.
//
// Every broker names its columns differently, so nothing is positional: each
// sheet is scanned for the row that looks most like a header, and columns are
// matched by regex. Whatever is found is a starting point — the UI lets the
// numbers and the equity/debt call be overridden before anything is filed.

import type { Trade, Category } from "./engine";

type Cell = unknown;
type Matrix = Cell[][];

// --- cell coercion ----------------------------------------------------------

function text(v: Cell): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const o = v as { richText?: { text: string }[]; result?: Cell; text?: string };
  if (o.richText) return o.richText.map((r) => r.text).join("").trim();
  if (o.result !== undefined) return text(o.result);
  if (o.text) return String(o.text).trim();
  return "";
}

function num(v: Cell): number {
  if (typeof v === "number") return v;
  const s = text(v).replace(/[₹,\s]/g, "");
  if (!s) return 0;
  const neg = /^\(.*\)$/.test(s); // (1,234) accounting negative
  const n = parseFloat(neg ? s.slice(1, -1) : s);
  return Number.isFinite(n) ? (neg ? -n : n) : 0;
}

const MONTHS = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ");
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Returns ISO yyyy-mm-dd, or "" if the cell isn't a date. Day-first (Indian). */
export function toISODate(v: Cell): string {
  if (v instanceof Date) return iso(v.getFullYear(), v.getMonth() + 1, v.getDate());
  if (typeof v === "number") {
    if (v < 20_000 || v > 80_000) return ""; // not a plausible Excel serial
    const d = new Date(EXCEL_EPOCH + v * 86_400_000);
    return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  const s = text(v);
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/.exec(s);
  if (m) return iso(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  m = /^(\d{1,2})[\s-]([A-Za-z]{3})[a-z]*[\s-](\d{2,4})/.exec(s);
  if (m) {
    const mi = MONTHS.indexOf(m[2].toLowerCase());
    if (mi >= 0) return iso(+m[3] < 100 ? 2000 + +m[3] : +m[3], mi + 1, +m[1]);
  }
  return "";
}

// --- header matching --------------------------------------------------------

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

type Patterns = Record<string, RegExp>;

/** The header row is the one matching the most distinct fields (min 3). */
function findHeader(rows: Matrix, patterns: Patterns) {
  let best: { row: number; cols: Record<string, number> } | null = null;
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const cols: Record<string, number> = {};
    rows[r].forEach((cell, c) => {
      const h = normalize(text(cell));
      if (!h) return;
      for (const [field, re] of Object.entries(patterns)) {
        // One field per column, first declared pattern wins — otherwise a
        // combined "Dr/Cr" header gets claimed as the debit column as well.
        if (cols[field] === undefined && re.test(h)) {
          cols[field] = c;
          break;
        }
      }
    });
    const score = Object.keys(cols).length;
    if (score >= 3 && score > Object.keys(best?.cols ?? {}).length) best = { row: r, cols };
  }
  return best;
}

// --- stock transaction analysis --------------------------------------------

const TRADE_COLS: Patterns = {
  name: /^(symbol|scrip|stock|security|instrument|isin|particulars|name.*(compan|scrip|security|fund)|.*name)$/,
  isin: /^isin/,
  quantity: /^(quantity|qty|units|shares|no of (shares|units))/,
  buyDate: /(buy|purchase|entry|acquisition|bought).*date|date.*(purchase|buy|acquisition|entry)/,
  sellDate: /(sell|sale|exit|sold).*date|date.*(sale|sell|exit)/,
  buyValue: /(buy|purchase|entry|acquisition).*(value|amount|cost|consideration)|cost of acquisition/,
  sellValue: /(sell|sale|exit).*(value|amount|consideration)|sale price|sales price/,
  buyPrice: /(buy|purchase|entry).*(price|rate|nav)/,
  sellPrice: /(sell|sale|exit).*(price|rate|nav)/,
  expenses: /transfer expense|expense|charges/,
  fmv2018: /fair market value|^fmv|31.*jan.*2018|grandfather/,
  segment: /^(segment|type|category|instrument type|asset (class|type)|product)/,
};

// Instruments with no STT — their gains sit at slab rate whatever the holding period.
const DEBT_NAME =
  /liquid|overnight|debt|gilt|g\s?sec|bond|money\s*market|ultra\s*short|low\s*duration|short\s*duration|credit\s*risk|banking\s*(and|&)?\s*psu|corporate\s*bond|floater|dynamic|treasury|savings\s*fund|income\s*fund/i;

function guessCategory(name: string, segment: string): Category {
  return DEBT_NAME.test(segment) || DEBT_NAME.test(name) ? "debt" : "equity";
}

export function parseTrades(matrices: Matrix[]): Trade[] {
  const trades: Trade[] = [];
  for (const rows of matrices) {
    const head = findHeader(rows, TRADE_COLS);
    if (!head || head.cols.buyDate === undefined || head.cols.sellDate === undefined) continue;
    const { cols } = head;
    const at = (row: Cell[], f: string) => (cols[f] === undefined ? undefined : row[cols[f]]);

    for (let r = head.row + 1; r < rows.length; r++) {
      const row = rows[r];
      const buyDate = toISODate(at(row, "buyDate"));
      const sellDate = toISODate(at(row, "sellDate"));
      if (!buyDate || !sellDate) continue; // blank line, sub-total, or a second header

      const quantity = num(at(row, "quantity"));
      const buyValue = num(at(row, "buyValue")) || quantity * num(at(row, "buyPrice"));
      const sellValue = num(at(row, "sellValue")) || quantity * num(at(row, "sellPrice"));
      if (!buyValue && !sellValue) continue;

      const name = text(at(row, "name")) || text(at(row, "isin")) || "UNNAMED";
      trades.push({
        name,
        isin: text(at(row, "isin")) || undefined,
        quantity,
        buyDate,
        sellDate,
        buyValue,
        sellValue,
        expenses: num(at(row, "expenses")) || undefined,
        fmv2018: num(at(row, "fmv2018")) || undefined,
        category: guessCategory(name, text(at(row, "segment"))),
      });
    }
  }
  return trades;
}

// --- account statement ------------------------------------------------------

// Order matters: the first pattern to match a header claims that column, so the
// combined "Dr/Cr" marker has to be recognised before the credit/debit columns.
const BANK_COLS: Patterns = {
  date: /^(date|txn date|transaction date|value date|posting date|tran date)/,
  description: /^(description|narration|particulars|remarks|details|transaction remarks)/,
  drcr: /^(dr cr|cr dr|transaction type|indicator|type)$/,
  credit: /^(credit|deposit|cr|credit amount|deposit amt|cr amount)/,
  debit: /^(debit|withdrawal|dr|debit amount|withdrawal amt|dr amount)/,
  amount: /^(amount|amt|transaction amount|net amount)$/,
};

export type IncomeKind =
  | "savings_interest"
  | "deposit_interest" // FD/RD/term deposit — a different line in the return
  | "dividend"
  | "salary" // net of TDS: informative only, never the gross figure
  | "tds" // a debit, and only ever the bank's own TDS
  | "other";

export interface StatementRow {
  date: string;
  description: string;
  credit: number;
  debit: number;
  kind: IncomeKind;
}

const TDS = /\btds\b|tax deducted/i;
const DIVIDEND = /\bdiv(idend|d)?\b|\bdvd\b/i;
const INTEREST = /\b(int|intt|interest|intr)\b/i;
// Only consulted once a row already looks like interest, so a plain
// "CASH DEPOSIT" never lands in the deposit-interest bucket.
const DEPOSIT = /\b(fd|rd|td)\b|(fixed|term|recurring)\s*deposit|\bdeposit\b/i;
const SALARY = /\bsalar(y|ies)\b|\bsal\b|\bpayroll\b/i;

function kindOf(description: string): IncomeKind {
  if (TDS.test(description)) return "tds";
  if (DIVIDEND.test(description)) return "dividend";
  if (INTEREST.test(description)) {
    return DEPOSIT.test(description) ? "deposit_interest" : "savings_interest";
  }
  if (SALARY.test(description)) return "salary";
  return "other";
}

/** Totals per kind, for prefilling the form. */
export function statementTotals(rows: StatementRow[]): Record<IncomeKind, number> {
  const totals = {
    savings_interest: 0, deposit_interest: 0, dividend: 0, salary: 0, tds: 0, other: 0,
  };
  for (const r of rows) totals[r.kind] += r.kind === "tds" ? r.debit : r.credit;
  return totals;
}

/** Credits, plus TDS debits — the only outgoing row that matters for tax. */
export function parseStatement(matrices: Matrix[]): StatementRow[] {
  const out: StatementRow[] = [];
  for (const rows of matrices) {
    const head = findHeader(rows, BANK_COLS);
    if (!head || head.cols.date === undefined) continue;
    const { cols } = head;
    const at = (row: Cell[], f: string) => (cols[f] === undefined ? undefined : row[cols[f]]);

    for (let r = head.row + 1; r < rows.length; r++) {
      const row = rows[r];
      const date = toISODate(at(row, "date"));
      if (!date) continue;

      let credit = num(at(row, "credit"));
      let debit = num(at(row, "debit"));
      if (cols.credit === undefined && cols.amount !== undefined) {
        // Single-amount statements: a Dr/Cr column, or a signed amount.
        const amount = num(at(row, "amount"));
        const marker = text(at(row, "drcr")).toLowerCase();
        const isCredit = marker ? /^c/.test(marker) : amount > 0;
        credit = isCredit ? Math.abs(amount) : 0;
        debit = isCredit ? 0 : Math.abs(amount);
      }

      const description = text(at(row, "description"));
      const kind = kindOf(description);
      // Credits are the income; the one debit worth keeping is TDS.
      if (credit <= 0 && !(kind === "tds" && debit > 0)) continue;
      out.push({ date, description, credit, debit, kind });
    }
  }
  return out;
}

// --- workbook loading -------------------------------------------------------

type ExcelModule = {
  Workbook: new () => import("exceljs").Workbook;
  default?: { Workbook: new () => import("exceljs").Workbook };
};

/**
 * exceljs ships a UMD bundle for browsers and CJS for node — the named export
 * lands in a different place depending on which one the bundler picked.
 * Loaded on demand so it stays out of the initial page bundle.
 */
export async function loadExcel() {
  const mod = (await import("exceljs")) as unknown as ExcelModule;
  return mod.Workbook ?? mod.default!.Workbook;
}

/** Every sheet of an .xlsx as a dense 0-indexed matrix of raw cell values. */
export async function readSheets(data: ArrayBuffer): Promise<Matrix[]> {
  const Workbook = await loadExcel();
  const wb = new Workbook();
  await wb.xlsx.load(data);

  const matrices: Matrix[] = [];
  wb.eachSheet((ws) => {
    const rows: Matrix = [];
    ws.eachRow({ includeEmpty: true }, (row) => {
      const values = row.values as Cell[]; // exceljs is 1-indexed, [0] is empty
      rows.push(Array.isArray(values) ? values.slice(1) : []);
    });
    matrices.push(rows);
  });
  return matrices;
}
