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
const MAX_CALLS = Number(process.env.MAX_CALLS || 6); // keep the demo short for a clean GIF; set 0 to spend the whole budget
const METHOD = (process.env.METHOD || "GET").toUpperCase(); // most paid data APIs are GET; set METHOD=POST for echo/RPC-style upstreams
const SELLER_PCT = 0.97;            // the API owner keeps 97% (100% for their first 3,000 calls)
const SCALE_CALLS = Number(process.env.SCALE_CALLS || 10000); // illustrative daily agent volume for the "at scale" line

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
const lemon = (s) => `\x1b[93m\x1b[1m${s}\x1b[0m`; // bright lemon yellow
function banner() {
  console.log("");
  console.log(lemon("  ╦  ╔═╗╔╦╗╔═╗╔╗╔  ╔═╗╔═╗╦╔═╔═╗"));
  console.log(lemon("  ║  ║╣ ║║║║ ║║║║  ║  ╠═╣╠╩╗║╣ ") + "  🍋");
  console.log(lemon("  ╩═╝╚═╝╩ ╩╚═╝╝╚╝  ╚═╝╩ ╩╩ ╩╚═╝"));
  console.log(c.dim("  the x402 payment rail for AI agents"));
}
// Compact one-line preview of what the agent got back for its money.
// Special-cases exchange-rate payloads so the GIF shows LIVE rates (the
// money-shot) instead of the provider URL that sorts first alphabetically.
function previewData(raw) {
  if (!raw) return "";
  try {
    const j = JSON.parse(raw);
    if (j && j.rates && j.base_code) {
      const parts = ["JPY", "EUR", "GBP", "CNY"]
        .filter((k) => j.rates[k] != null)
        .map((k) => `${k} ${j.rates[k]}`)
        .join(" · ");
      if (parts) return `${j.base_code} → ${parts}  (live FX)`;
    }
  } catch { /* not json / not fx — fall through */ }
  let s = raw;
  try { s = JSON.stringify(JSON.parse(raw)); } catch { /* not json */ }
  s = s.replace(/\s+/g, " ").trim();
  return s.length > 62 ? s.slice(0, 62) + "…" : s;
}

if (!process.env.JWT && (!BK || !BK.startsWith("bk_"))) {
  console.error("✗ Set BK=bk_... (Buyer Key w/ saved card) OR JWT=<existing Pay Token> to reuse a funded token.");
  process.exit(1);
}

async function main() {
  banner();
  console.log(c.b("  AGENT UNLEASHED"));
  console.log(c.dim("  an AI agent pays for an API on its own — and the API owner earns, automatically"));
  console.log(c.dim("  no human · no API key · no crypto · just a hard-capped card"));
  rule();

  // ── Phase 1 — DISCOVER (the agent finds a paid tool via MCP) ───────────────
  console.log(c.cyan("▌ Phase 1 — DISCOVER"));
  console.log(`  task: ${c.b(`"${TASK}"`)}`);
  await sleep(700);
  console.log(`  🔎 found a paid tool via MCP:  ${c.b("premium-data")}  ${c.dim(`(${BASE}/g/${EP})`)}`);
  console.log(c.dim("     a dev's API, monetized with LemonCake · pay-per-call (x402) · no subscription, no key"));
  rule();
  await sleep(900);

  // ── Phase 2 — BUDGET (the agent funds + checks its own capped wallet) ──────
  console.log(c.cyan("▌ Phase 2 — BUDGET"));
  let jwt = process.env.JWT || "";
  let total, price, maxCalls;
  if (jwt) {
    // Reuse an already-funded Pay Token — no buyer key, no mint, no new charge.
    console.log(c.dim("  ♻ reusing a funded Pay Token (no mint, no new charge — the budget was prepaid earlier)…"));
    price = Number(process.env.PRICE || 0.01);
    total = Number(process.env.BUDGET_DOLLARS || 0.5) * 100;
    maxCalls = Math.max(1, Math.round((total / 100) / price));
  } else {
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
    jwt = mint.jwt;
    total = mint.token.budget * 100;                 // cents available this task
    price = mint.token.budget / mint.token.maxCalls; // $/call
    maxCalls = mint.token.maxCalls;
  }
  let remaining = total;
  console.log(`  agent wallet (LemonCake Pay Token): ${c.b(usd(total))} ${c.dim(`/ daily cap $${CAP}`)}`);
  console.log(c.dim(`  → ${usd(total)} ÷ ${usd(Math.max(1, Math.round(price * 100)))}/call = up to ${c.b(String(maxCalls))} calls`));
  console.log(`  ${c.green(bar(remaining, total))} ${usd(remaining)}`);
  console.log(c.dim(`  policy: within cap → approved · custody-free · it physically can't overspend`));
  rule();
  await sleep(900);

  // ── Phase 3 — PAY (autonomous x402, one call at a time) ────────────────────
  console.log(c.cyan("▌ Phase 3 — PAY  ") + c.dim("(autonomous — no human approves any of these · the owner gets paid each time)"));
  let n = 0;
  let sellerEarnedCents = 0;
  let transient = 0;
  while (true) {
    const res = await fetch(`${BASE}/g/${EP}`, { method: METHOD, headers: { Authorization: `Bearer ${jwt}` } });
    if (res.status === 200) {
      transient = 0;
      n += 1;
      const charge = Number(res.headers.get("x-lemoncake-charge") || price);
      remaining = Math.max(0, remaining - Math.round(charge * 100));
      const got = previewData(await res.text());
      const earned = charge * SELLER_PCT;
      sellerEarnedCents += earned * 100;
      console.log(
        `  → call #${String(n).padStart(2)}  agent ${c.green("paid")} ${usd(Math.round(charge * 100))} ${c.dim("→")} ` +
        `💰 owner ${c.yellow("earned")} $${earned.toFixed(4)}   ${c.green(bar(remaining, total))} ${usd(remaining)}`,
      );
      if (got) console.log(c.dim(`       ↳ got: ${got}`));
      if (MAX_CALLS && n >= MAX_CALLS) {
        // Keep the demo short. The agent stops; the hard cap is the safety story.
        const perCall = (total - remaining) / 100 / n;
        const daily = perCall * SELLER_PCT * SCALE_CALLS;
        rule();
        console.log(c.cyan("▌ Phase 4 — RESULT"));
        console.log(`  buyer:  ${c.b(`${n} calls`)} · spent ${c.b(usd(total - remaining))} of the ${"$" + CAP} cap · hard-capped, can't run away`);
        console.log(`  seller: 💰 ${c.yellow(`your API earned $${(sellerEarnedCents / 100).toFixed(4)}`)} ${c.dim("— auto-collected, no invoice, no chasing payment")}`);
        console.log(c.dim(`  at scale: $${perCall.toFixed(2)}/call × ${SCALE_CALLS.toLocaleString()} agent calls/day ≈ $${daily.toFixed(0)}/day, billed automatically`));
        console.log(c.dim("  no human · no API key · no crypto · just a capped card · you keep 97% (100% for your first 3,000 calls)"));
        rule();
        console.log(c.dim(`  Monetize your own API/MCP in minutes: ${BASE}`));
        console.log("");
        return;
      }
      await sleep(DELAY);
      continue;
    }
    if (res.status === 429) {
      // Rate-limited (the gateway allows N paid calls/60s). NOT the budget cap.
      console.log(c.dim("  ⏳ rate-limited — backing off 2s (not the budget cap)…"));
      await sleep(2000);
      continue;
    }

    if (res.status >= 500) {
      // The seller's upstream API hiccuped (5xx). This is transient and is NOT a
      // payment failure — the budget is untouched. Back off and retry the call.
      transient += 1;
      if (transient <= 3) {
        console.log(c.dim(`  ⚠ upstream ${res.status} (seller API hiccup, not a payment issue) — retry ${transient}/3…`));
        await sleep(1500);
        continue;
      }
      rule();
      console.log(c.red(`✗ seller upstream kept returning ${res.status} — the API behind ${EP} is flaky.`));
      console.log(c.dim(`  the payment rail worked fine: ${c.b(`${n} paid calls`)}, ${usd(total - remaining)} spent, ${usd(remaining)} left.`));
      console.log(c.dim(`  → point EP at a reliable endpoint for the recording (see README).`));
      rule();
      process.exit(5);
    }

    // Any other status: read the REAL reason from the body. The gateway returns
    // 402 for BOTH "budget gone" AND "token rejected", plus 401/403/502/503 for
    // other failures — so we must NOT blindly call this "budget exhausted".
    let code = `http_${res.status}`;
    let msg = "";
    try { const j = JSON.parse(await res.text()); code = j.error || code; msg = j.message || j.detail || ""; } catch { /* non-json */ }

    // The ONLY codes that mean "the agent actually spent its budget":
    const BUDGET_GONE = new Set(["token_exhausted", "spend_cap_exceeded"]);
    if (BUDGET_GONE.has(code)) {
      rule();
      console.log(c.cyan("▌ Phase 4 — RESULT"));
      console.log(`  buyer:  ${c.b(`${n} calls`)} · spent ${c.b(usd(total - remaining))} · 🛑 budget gone → gateway returns x402, agent stops`);
      console.log(`  seller: 💰 ${c.yellow(`your API earned $${(sellerEarnedCents / 100).toFixed(4)}`)} ${c.dim("— auto-collected, no invoice")}`);
      console.log(c.dim("  0 overspend · 0 humans · 0 crypto · you keep 97% (100% for your first 3,000 calls)"));
      rule();
      console.log(c.dim(`  Monetize your own API/MCP in minutes: ${BASE}`));
      console.log("");
      return;
    }

    // Otherwise it's a REAL failure — surface it honestly instead of faking a clean ending.
    const HINT = {
      invalid_pay_token:      "the gateway rejected the JWT (signing/verify mismatch or malformed token).",
      token_endpoint_mismatch:"the token was minted for a different endpoint than the one called (EP mismatch).",
      pay_token_not_found:    "the minted token isn't in the gateway's DB (mint/gateway on different envs?).",
      endpoint_paused:        "the seller endpoint is paused (status != live).",
      upstream_unreachable:   "the seller's real API behind this endpoint is down/unreachable.",
      upstream_error:         "the seller's real API returned a 5xx.",
    }[code] || "unexpected gateway response.";
    rule();
    console.log(c.red(`✗ call #${n + 1} refused: ${c.b(code)} ${c.dim(`(HTTP ${res.status})`)}`));
    console.log(c.dim(`  ${HINT}`));
    if (msg) console.log(c.dim(`  server: ${msg}`));
    console.log(c.dim(`  (NOT a budget issue — the wallet still had ${usd(remaining)} of ${usd(total)}.)`));
    rule();
    process.exit(4);
  }
}

main().catch((e) => { console.error(c.red("error:"), e?.message || e); process.exit(3); });
