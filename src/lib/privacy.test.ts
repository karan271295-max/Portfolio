// Runnable self-check for privacy mode. `npx tsx src/lib/privacy.test.ts`
import assert from "node:assert";
import { derive, newSalt, verify } from "./privacy";
import { formatMoney, formatPercent, setMaskAmounts } from "./format";

const unhex = (s: string) => Uint8Array.from(s.match(/../g)!.map((b) => parseInt(b, 16)));

async function main() {
  // --- passphrase verification ---------------------------------------------
  const salt = newSalt();
  const verifier = await derive("correct horse", unhex(salt));
  const stored = { masked: true, salt, verifier };

  assert(await verify("correct horse", stored), "right passphrase verifies");
  assert(!(await verify("Correct horse", stored)), "case matters");
  assert(!(await verify("wrong", stored)), "wrong passphrase rejected");
  assert(!(await verify("", stored)), "empty passphrase rejected");
  assert(
    !(await verify("correct horse", { masked: true, salt: null, verifier: null })),
    "nothing verifies before a passphrase is set",
  );

  // The verifier is derived, never the passphrase itself.
  assert(!verifier.includes("correct"), "passphrase is not stored");
  assert(verifier.length === 64, "256-bit verifier");

  // A fresh salt gives a different verifier for the same passphrase.
  const other = await derive("correct horse", unhex(newSalt()));
  assert(other !== verifier, "salted per install");

  // --- masking --------------------------------------------------------------
  setMaskAmounts(false);
  assert(formatMoney(6306525) === "₹63,06,525", `plain: ${formatMoney(6306525)}`);

  setMaskAmounts(true);
  assert(formatMoney(6306525) === "₹••••••", `masked: ${formatMoney(6306525)}`);
  assert(formatMoney(-5000) === "-₹••••••", "negatives keep their sign");
  assert(formatMoney(747000, "INR", { signed: true }) === "+₹••••••", "signed keeps its sign");
  assert(formatMoney(1e7, "INR", { compact: true }) === "₹••••••", "compact is masked too");
  assert(formatMoney(500, "USD") === "$••••••", "other currencies keep their symbol");
  // Percentages are deliberately untouched — they carry no absolute amount.
  assert(formatPercent(13.43) === "13.43%", "percentages stay visible");

  setMaskAmounts(false);
  assert(formatMoney(6306525) === "₹63,06,525", "unmasking restores the figure");

  console.log("privacy.test: all assertions passed ✓");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
