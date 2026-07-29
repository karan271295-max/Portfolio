// Runnable self-check for the Excel readers and the workbook writer.
// `npx tsx src/lib/tax/parse.test.ts` — builds broker-shaped files in memory,
// reads them back through the parsers, then writes the computation out.
import assert from "node:assert";
import ExcelJS from "exceljs";
import { readSheets, parseTrades, parseStatement, statementTotals, toISODate } from "./parse";
import { computeTax, totalGains, gainsByInstalment } from "./engine";
import { buildWorkbook } from "./workbook";

const near = (a: number, b: number, tol = 0.01, what = "") =>
  assert(Math.abs(a - b) <= tol, `${what}: expected ${b}, got ${a}`);

// --- date coercion ----------------------------------------------------------
assert(toISODate("24/04/2025") === "2025-04-24", "dd/mm/yyyy");
assert(toISODate("06-06-2025") === "2025-06-06", "dd-mm-yyyy");
assert(toISODate("12-Aug-2020") === "2020-08-12", "dd-MMM-yyyy");
assert(toISODate("2025-04-24") === "2025-04-24", "ISO");
assert(toISODate(45771) === "2025-04-24", "Excel serial");
assert(toISODate(new Date(2025, 3, 24)) === "2025-04-24", "Date object");
assert(toISODate("not a date") === "", "garbage rejected");

async function main() {
  async function buffer(build: (wb: ExcelJS.Workbook) => void) {
    const wb = new ExcelJS.Workbook();
    build(wb);
    return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  }

  // --- stock transaction analysis --------------------------------------------
  // Preamble rows above the header, a sub-total row below: both must be skipped.
  const tradeFile = await buffer((wb) => {
    const ws = wb.addWorksheet("Tradewise Exits");
    ws.addRow(["Tax P&L statement"]);
    ws.addRow([]);
    ws.addRow(["Symbol", "ISIN", "Quantity", "Buy Date", "Buy Value", "Sell Date", "Sell Value"]);
    ws.addRow(["HYUNDAI", "INE0V6F01027", 5, "21/10/2024", 9800, "21/08/2025", 12566]);
    ws.addRow(["HDFCBANK", "INE040A01034", 8, "12/08/2020", 8630.71, "06/06/2025", 15914.4]);
    ws.addRow(["LIQUIDCASE", "INF204KC1234", 50, "24/04/2025", 54105, "14/05/2025", 54265]);
    ws.addRow(["TRENT", "INE849A01020", 1, "04/07/2025", 28717.5, "23/03/2026", 16992.5]);
    ws.addRow(["Total", "", "", "", 101253.21, "", 99737.9]);
  });

  const trades = parseTrades(await readSheets(tradeFile));
  assert(trades.length === 4, `expected 4 trades, got ${trades.length}`);
  assert(trades[0].name === "HYUNDAI" && trades[0].buyDate === "2024-10-21", "first trade");
  assert(trades[2].category === "debt", "LIQUIDCASE guessed as debt");
  assert(trades[0].category === "equity", "HYUNDAI guessed as equity");

  const gains = totalGains(trades);
  near(gains.stcg111a, 2766 - 11725, 0.01, "STCG 20% net of the TRENT loss");
  near(gains.ltcg112a, 7283.69, 0.01, "LTCG 12.5%");
  near(gains.slab, 160, 0.01, "no-STT slab gain");

  // Price-per-unit files (no value columns) are multiplied out by quantity.
  const priceFile = await buffer((wb) => {
    const ws = wb.addWorksheet("Realised");
    ws.addRow(["Stock name", "Quantity", "Buy date", "Buy price", "Sell date", "Sell price"]);
    ws.addRow(["ITC", 10, "30/12/2024", 41.5, "25/06/2025", 83.25]);
  });
  const priced = parseTrades(await readSheets(priceFile));
  near(priced[0].buyValue, 415, 0.01, "qty × buy price");
  near(priced[0].sellValue, 832.5, 0.01, "qty × sell price");

  // --- account statement ------------------------------------------------------
  const bankFile = await buffer((wb) => {
    const ws = wb.addWorksheet("Statement");
    ws.addRow(["Account statement"]);
    ws.addRow(["Date", "Narration", "Debit", "Credit", "Balance"]);
    ws.addRow(["30/06/2025", "CREDIT INTEREST", 0, 3121, 103121]);
    ws.addRow(["28/07/2025", "ACH C- MPHASIS LIMITED DIVIDEND", 0, 855, 103976]);
    ws.addRow(["01/08/2025", "UPI/PAYTM/GROCERIES", 2400, 0, 101576]);
    ws.addRow(["05/08/2025", "NEFT SALARY CREDIT", 0, 383333, 484909]);
    ws.addRow(["31/03/2026", "INT ON FD 0012345678", 0, 108044, 593000]);
    ws.addRow(["31/03/2026", "TDS ON FD INTEREST", 10804, 0, 582196]);
  });

  const statement = parseStatement(await readSheets(bankFile));
  assert(statement.length === 5, `credits + TDS debit, got ${statement.length}`);
  assert(statement[0].kind === "savings_interest", "savings interest classified");
  assert(statement[1].kind === "dividend", "dividend classified");
  assert(statement[2].kind === "salary", "salary credit classified");
  assert(statement[3].kind === "deposit_interest", "FD interest split from savings interest");
  assert(statement[4].kind === "tds", "TDS debit kept");
  assert(!statement.some((r) => r.description.includes("GROCERIES")), "ordinary debit dropped");

  const totals = statementTotals(statement);
  near(totals.savings_interest, 3121, 0.01, "savings interest total");
  near(totals.deposit_interest, 108044, 0.01, "deposit interest total");
  near(totals.dividend, 855, 0.01, "dividend total");
  near(totals.salary, 383333, 0.01, "net salary credits — never the gross figure");
  near(totals.tds, 10804, 0.01, "TDS total from the debit column");

  // Single-amount statements with a Dr/Cr marker.
  const drcrFile = await buffer((wb) => {
    const ws = wb.addWorksheet("Ledger");
    ws.addRow(["Txn Date", "Particulars", "Amount", "Dr/Cr"]);
    ws.addRow(["30/06/2025", "INT PD", 4389, "Cr"]);
    ws.addRow(["30/06/2025", "BROKERAGE", 118, "Dr"]);
  });
  const ledger = parseStatement(await readSheets(drcrFile));
  assert(ledger.length === 1 && ledger[0].credit === 4389, "Dr/Cr marker respected");

  // --- workbook out -----------------------------------------------------------
  const tax = computeTax({
    salaryGross: 4_800_000,
    businessIncome: 0,
    savingsInterest: 3_121,
    otherInterest: 0,
    dividend: 855,
    gains,
    tds: 10_50_807,
    advanceTax: [0, 0, 0, 0],
    computationDate: "2026-07-29",
    quarterGains: gainsByInstalment(trades, 2026),
  });

  const out = new ExcelJS.Workbook();
  await out.xlsx.load(
    await (
      await buildWorkbook(
        { name: "KARAN MALHOTRA", pan: "CURPM5116Q", assessmentYear: "2026 - 2027", financialYear: "2025 - 2026" },
        tax,
        trades,
        statement,
      )
    ).arrayBuffer(),
  );

  const names = out.worksheets.map((w) => w.name);
  assert(names[0] === "Computation", "computation sheet first");
  assert(names.includes("LTCG 12.5%") && names.includes("STCG Slab (No STT)"), `sheets: ${names}`);

  const flat = (name: string) =>
    out
      .getWorksheet(name)!
      .getSheetValues()
      .flatMap((r) => (Array.isArray(r) ? r : []));
  assert(flat("Computation").includes(tax.totalIncome), "total income written");
  assert(flat("Computation").includes("PAN"), "assessee block written");
  // One data row + one total row for the single long-term trade.
  assert(out.getWorksheet("LTCG 12.5%")!.rowCount === 5, "LTCG sheet rows");

  console.log("tax/parse.test: all assertions passed ✓");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
