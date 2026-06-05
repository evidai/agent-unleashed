#!/usr/bin/env node
/**
 * AGENT UNLEASHED (AI edition) — an AI agent pays, per call, for a capability it
 * can't get for free: live LLM inference behind someone else's API key.
 *
 * The seller wraps an OpenAI-compatible chat endpoint (e.g. Groq) and sets a
 * price. The buyer agent does NOT have the seller's model key — it just pays
 * $0.01/call through the x402 gateway and gets an answer. No subscription, no
 * shared key, no crypto. The owner earns on every call.
 *
 *   Why this isn't "free data": the agent is buying inference it cannot perform
 *   itself — the seller's key/compute is the product. That's the real pitch.
 *
 * Run (Buyer Key must be scoped to the AI endpoint + have a saved card):
 *   BK=bk_xxxxx EP=<shortId> node agent-ai.mjs
 *
 * Optional env:
 *   BASE=https://www.lemoncake.xyz   FUND_CENTS=50   CALL_DELAY_MS=700
 *   MODEL=llama-3.1-8b-instant   CAP_DOLLARS=5
 */

const BK = process.env.BK;
const BASE = (process.env.BASE || "https://www.lemoncake.xyz").replace(/\/$/, "");
const EP = process.env.EP || "";
const FUND_CENTS = Number(process.env.FUND_CENTS || 50);
const DELAY = Number(process.env.CALL_DELAY_MS || 700);
const CAP = process.env.CAP_DOLLARS || "5.00";
const MODEL = process.env.MODEL || "llama-3.1-8b-instant";
const SELLER_PCT = 0.97;
const SCALE_CALLS = Number(process.env.SCALE_CALLS || 10000);

// The agent's task: 6 quick dev answers you'd otherwise stop and google. Each
// item = one paid inference call. Short, concrete, obviously worth paying for.
// (Label before " — " is shown; keep it ≤8 chars for clean alignment.)
const JOBS = [
  "regex — a regex that validates an email address. Output the pattern only, no prose.",
  "find — one-line bash to list files larger than 100MB under the current dir. Command only.",
  "SQL — query for the top 5 customers by total revenue this month. SQL only, no prose.",
  "cron — cron expression for every weekday at 9:30am. Output the expression only.",
  "git — command to undo the last commit but keep the changes unstaged. Command only.",
  "error — one-line cause + fix for: ECONNREFUSED 127.0.0.1:5432. ≤14 words.",
];

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

// Pull the model's answer out of an OpenAI-compatible chat response.
function clean(s) {
  return String(s)
    .replace(/```[a-z]*/gi, "")   // strip markdown code fences + language tag
    .replace(/`/g, "")            // strip stray backticks
    .replace(/\s+/g, " ")
    .trim();
}
function answerOf(raw) {
  try {
    const j = JSON.parse(raw);
    const txt = j?.choices?.[0]?.message?.content;
    if (txt) return clean(txt);
    if (j?.error?.message) return `⚠ upstream: ${j.error.message}`;
  } catch { /* not json */ }
  return clean(raw).slice(0, 70);
}

if (!BK || !BK.startsWith("bk_")) {
  console.error("✗ Set BK=bk_... (a Buyer Key scoped to the AI endpoint, with a saved card).");
  process.exit(1);
}
if (!EP) { console.error("✗ Set EP=<shortId> of your AI endpoint."); process.exit(1); }

async function main() {
  banner();
  console.log(c.b("  AGENT UNLEASHED — AI edition"));
  console.log(c.dim("  an AI agent buys inference it can't do itself — per call — and the owner earns"));
  console.log(c.dim("  no human · no shared key · no subscription · no crypto · just a hard-capped card"));
  rule();

  // ── Phase 1 — DISCOVER ─────────────────────────────────────────────────────
  console.log(c.cyan("▌ Phase 1 — DISCOVER"));
  console.log(`  task: ${c.b('"answer 6 dev questions I\'d otherwise stop and google"')}`);
  await sleep(600);
  console.log(`  🔎 found a paid AI tool via MCP:  ${c.b("ai-answer")}  ${c.dim(`(${BASE}/g/${EP})`)}`);
  console.log(c.dim("     a dev's LLM endpoint, monetized with LemonCake · pay-per-call (x402) · the seller's key, not mine"));
  rule();
  await sleep(700);

  // ── Phase 2 — BUDGET ───────────────────────────────────────────────────────
  console.log(c.cyan("▌ Phase 2 — BUDGET"));
  let jwt = process.env.JWT || "";
  let total, price, maxCalls;
  if (jwt) {
    // Reuse a previously-minted token (no new charge) — handy while debugging.
    console.log(c.dim("  ♻ reusing Pay Token from $JWT — no new charge"));
    price = Number(process.env.PRICE || 0.01);
    total = Number(process.env.BUDGET_DOLLARS || FUND_CENTS / 100) * 100;
    maxCalls = Math.max(1, Math.round((total / 100) / price));
  } else {
    console.log(c.dim("  💳 funding a hard-capped prepaid wallet (Stripe card — not crypto)…"));
    const mintRes = await fetch(`${BASE}/api/lc/agent/tokens`, {
      method: "POST",
      headers: { Authorization: `Bearer ${BK}`, "content-type": "application/json" },
      body: JSON.stringify({ endpointShortId: EP, amountCents: FUND_CENTS, idempotencyKey: `ai-${Date.now()}` }),
    });
    const mint = await mintRes.json();
    if (!mintRes.ok || !mint.jwt) {
      console.error(c.red(`✗ funding failed: ${mint.error || mintRes.status}`));
      process.exit(2);
    }
    jwt = mint.jwt;
    total = mint.token.budget * 100;
    price = mint.token.budget / mint.token.maxCalls;
    maxCalls = mint.token.maxCalls;
    if (process.env.DEBUG) console.log(c.dim(`  💡 to retry without re-charging: export JWT='${jwt}'`));
  }
  let remaining = total;
  console.log(`  agent wallet (LemonCake Pay Token): ${c.b(usd(total))} ${c.dim(`/ daily cap $${CAP}`)}`);
  console.log(c.dim(`  → ${usd(total)} ÷ ${usd(Math.max(1, Math.round(price * 100)))}/call = up to ${c.b(String(maxCalls))} inference calls`));
  console.log(`  ${c.green(bar(remaining, total))} ${usd(remaining)}`);
  console.log(c.dim("  policy: within cap → approved · custody-free · it physically can't overspend"));
  rule();
  await sleep(700);

  // ── Phase 3 — PAY (per-call paid inference) ────────────────────────────────
  console.log(c.cyan("▌ Phase 3 — PAY  ") + c.dim("(autonomous · each answer is a paid LLM call · the owner gets paid each time)"));
  let n = 0;
  let sellerEarnedCents = 0;
  const jobs = JOBS.slice(0, Math.min(JOBS.length, Number(process.env.MAX_CALLS || 6)));
  let stop = false;
  for (const job of jobs) {
    let attempt = 0;
    while (true) {
      const res = await fetch(`${BASE}/g/${EP}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: job }], max_tokens: 64 }),
      });

      // 429 (rate limit) / 5xx (upstream hiccup): retry the SAME job, don't skip it.
      if (res.status === 429 || res.status >= 500) {
        attempt += 1;
        if (attempt <= 5) {
          console.log(c.dim(`  ⏳ upstream ${res.status} (busy — not a payment issue) — retry ${attempt}/5…`));
          await sleep(2500);
          continue;
        }
        console.log(c.red(`✗ upstream stayed ${res.status} after 5 tries; the rail was fine (${n} paid, ${usd(total - remaining)} spent).`));
        console.log(c.dim("  → free models rate-limit hard. Add OpenRouter credit + use a paid model (drop :free)."));
        process.exit(5);
      }

      if (res.status !== 200) {
        const raw = await res.text();
        let code = `http_${res.status}`, detail = "";
        try {
          const j = JSON.parse(raw);
          const e = j.error;
          if (typeof e === "string") { code = e; detail = j.message || j.detail || ""; }
          else if (e && typeof e === "object") { code = e.code ? `upstream_${e.code}` : code; detail = e.message || JSON.stringify(e); }
          else { detail = JSON.stringify(j).slice(0, 180); }
        } catch { detail = raw.slice(0, 180); }
        if (code === "token_exhausted" || code === "spend_cap_exceeded") { stop = true; break; }
        console.log(c.red(`✗ call refused: ${code} (HTTP ${res.status}) — not a budget issue (${usd(remaining)} left).`));
        if (detail) console.log(c.dim(`  upstream says: ${detail}`));
        process.exit(4);
      }

      // 200 — paid, answered.
      n += 1;
      const charge = Number(res.headers.get("x-lemoncake-charge") || price);
      remaining = Math.max(0, remaining - Math.round(charge * 100));
      const ans = answerOf(await res.text());
      const earned = charge * SELLER_PCT;
      sellerEarnedCents += earned * 100;
      const label = job.split(" — ")[0];
      console.log(
        `  → ${c.b(label.padEnd(8))} agent ${c.green("paid")} ${usd(Math.round(charge * 100))} ${c.dim("→")} ` +
        `💰 owner ${c.yellow("earned")} $${earned.toFixed(4)}   ${c.green(bar(remaining, total))} ${usd(remaining)}`,
      );
      console.log(c.dim(`       ↳ AI: ${ans.length > 64 ? ans.slice(0, 64) + "…" : ans}`));
      await sleep(DELAY);
      break;
    }
    if (stop) break;
  }

  // ── Phase 4 — RESULT ───────────────────────────────────────────────────────
  const perCall = n ? (total - remaining) / 100 / n : 0;
  const daily = perCall * SELLER_PCT * SCALE_CALLS;
  rule();
  console.log(c.cyan("▌ Phase 4 — RESULT"));
  console.log(`  buyer:  ${c.b(`${n} AI calls`)} · spent ${c.b(usd(total - remaining))} of the ${"$" + CAP} cap · hard-capped, can't run away`);
  console.log(`  seller: 💰 ${c.yellow(`your AI endpoint earned $${(sellerEarnedCents / 100).toFixed(4)}`)} ${c.dim("— auto-collected, no invoice, no chasing")}`);
  console.log(c.dim(`  at scale: $${perCall.toFixed(2)}/call × ${SCALE_CALLS.toLocaleString()} agent calls/day ≈ $${daily.toFixed(0)}/day, billed automatically`));
  console.log(c.dim("  no human · no shared key · no subscription · no crypto · you keep 97% (100% for your first 3,000 calls)"));
  rule();
  console.log(c.dim(`  Monetize YOUR model/API per call in minutes: ${BASE}`));
  console.log("");
}

main().catch((e) => { console.error(c.red("error:"), e?.message || e); process.exit(3); });
