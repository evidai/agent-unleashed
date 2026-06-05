#!/usr/bin/env node
/**
 * AGENT UNLEASHED — an AI agent with a hard-capped card, let loose.
 *
 * It discovers a paid API, checks its own budget, pays for each call on its own
 * via x402, and stops the moment the budget is gone. No human in the loop.
 *
 *   …and no crypto. The wallet is a hard-capped prepaid card (Stripe), not USDC.
 *
 * Run (your Buyer Key must have a saved card — see lemoncake.xyz/agent/fund):
 *   BK=bk_xxxxx node agent-unleashed.mjs
 *
 * Optional env:
 *   BASE=https://www.lemoncake.xyz   EP=vy3tteqe   FUND_CENTS=50
 *   CALL_DELAY_MS=600   CAP_DOLLARS=5   TASK="enrich my dataset with live data"
 *
 * Cost: one real mint of FUND_CENTS (Stripe min $0.50). The per-call loop spends
 * that prepaid balance — no extra card charge. Node 18+ (global fetch).
 */

const BK = process.env.BK;
const BASE = (process.env.BASE || "https://www.lemoncake.xyz").replace(/\/$/, "");
const EP = process.env.EP || "vy3tteqe";
const FUND_CENTS = Number(process.env.FUND_CENTS || 50);
const DELAY = Number(process.env.CALL_DELAY_MS || 600);
const CAP = process.env.CAP_DOLLARS || "5.00";        // headline "hard cap" (safety story)
const TASK = process.env.TASK || "enrich my dataset with live market data";

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const usd = (cents) => `$${(cents / 100).toFixed(2)}`;
const bar = (remaining, total, width = 18) => {
  const filled = Math.max(0, Math.round((remaining / total) * width));
  return `[${"▓".repeat(filled)}${"░".repeat(width - filled)}]`;
};
const rule = () => console.log(c.dim("─".repeat(60)));

if (!BK || !BK.startsWith("bk_")) {
  console.error("✗ Set BK=bk_... (a Buyer Key with a saved card — lemoncake.xyz/agent/fund)");
  process.exit(1);
}

async function main() {
  console.log("");
  console.log(c.b("  AGENT UNLEASHED"));
  console.log(c.dim(`  an AI agent with a ${"$" + CAP} hard-capped card, let loose`));
  console.log(c.dim("  no human · no API key · no crypto · it pays its own way"));
  rule();

  // ── Phase 1 — DISCOVER (the agent finds a paid tool via MCP) ───────────────
  console.log(c.cyan("▌ Phase 1 — DISCOVER"));
  console.log(`  task: ${c.b(`"${TASK}"`)}`);
  await sleep(700);
  console.log(`  🔎 found a paid tool via MCP:  ${c.b("premium-data")}  ${c.dim(`(${BASE}/g/${EP})`)}`);
  console.log(c.dim("     x402-enabled · pay-per-call · no subscription, no API key"));
  rule();
  await sleep(900);

  // ── Phase 2 — BUDGET (the agent funds + checks its own capped wallet) ──────
  console.log(c.cyan("▌ Phase 2 — BUDGET"));
  console.log(c.dim("  💳 funding a hard-capped prepaid wallet (Stripe card — not crypto)…"));
  const mintRes = await fetch(`${BASE}/api/lc/agent/tokens`, {
    method: "POST",
    headers: { Authorization: `Bearer ${BK}`, "content-type": "application/json" },
    body: JSON.stringify({ endpointShortId: EP, amountCents: FUND_CENTS, idempotencyKey: `unleash-${Date.now()}` }),
  });
  const mint = await mintRes.json();
  if (!mintRes.ok || !mint.jwt) {
    const why = mint.error === "no_payment_method"
      ? "  → this Buyer Key has no saved card. Save one at /agent/fund first."
      : mint.error === "amount_too_small"
        ? "  → Stripe minimum is $0.50 — set FUND_CENTS=50 or higher."
        : "";
    console.error(c.red(`✗ funding failed: ${mint.error || mintRes.status}`) + why);
    process.exit(2);
  }
  const jwt = mint.jwt;
  const total = mint.token.budget * 100;                 // cents available this task
  const price = mint.token.budget / mint.token.maxCalls; // $/call
  let remaining = total;
  console.log(`  agent wallet (LemonCake Pay Token): ${c.b(usd(total))} ${c.dim(`/ daily cap $${CAP}`)}`);
  console.log(`  ${c.green(bar(remaining, total))} ${usd(remaining)}`);
  console.log(c.dim(`  policy: within cap → approved · custody-free · it physically can't overspend`));
  rule();
  await sleep(900);

  // ── Phase 3 — PAY (autonomous x402, one call at a time) ────────────────────
  console.log(c.cyan("▌ Phase 3 — PAY  ") + c.dim("(autonomous — no human approves any of these)"));
  let n = 0;
  while (true) {
    const res = await fetch(`${BASE}/g/${EP}`, { method: "POST", headers: { Authorization: `Bearer ${jwt}` } });
    if (res.status === 200) {
      n += 1;
      const charge = Number(res.headers.get("x-lemoncake-charge") || price);
      remaining = Math.max(0, remaining - Math.round(charge * 100));
      console.log(
        `  → call #${String(n).padStart(2)}  ${c.dim("402")}→${c.green("paid")} ${usd(Math.round(charge * 100))} ${c.dim("(Stripe)")} ` +
        `${c.green("✓")}  ${c.green(bar(remaining, total))} ${usd(remaining)}`,
      );
      await sleep(DELAY);
      continue;
    }
    // 402 → budget gone. The gateway refuses instead of letting it overspend.
    rule();
    console.log(c.cyan("▌ Phase 4 — RESULT / STOP"));
    console.log(`  ✅ task ran on ${c.b(`${n} paid calls`)} · spent ${c.b(usd(total - remaining))} of the ${"$" + CAP} cap`);
    console.log(c.yellow("  🛑 budget exhausted → the gateway returns x402 and the agent stops."));
    console.log(c.dim("     0 overspend · 0 humans · 0 crypto · just a hard-capped card."));
    rule();
    console.log(c.dim(`  Make your own API pay-per-call like this: ${BASE}`));
    console.log("");
    return;
  }
}

main().catch((e) => { console.error(c.red("error:"), e?.message || e); process.exit(3); });
