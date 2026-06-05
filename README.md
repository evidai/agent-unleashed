# 🍋 Agent Unleashed

**I gave an AI agent a hard-capped card and let it loose. It pays for APIs on its own — and stops when the money's gone.**

No human in the loop. No API key. **No crypto** — the wallet is a hard-capped prepaid card (Stripe), not USDC.

![demo](./demo.gif)

```
  AGENT UNLEASHED
  an AI agent with a $5 hard-capped card, let loose
  no human · no API key · no crypto · it pays its own way
────────────────────────────────────────────────────────────
▌ Phase 1 — DISCOVER
  task: "enrich my dataset with live market data"
  🔎 found a paid tool via MCP:  premium-data  (…/g/vy3tteqe)
     x402-enabled · pay-per-call · no subscription, no API key
────────────────────────────────────────────────────────────
▌ Phase 2 — BUDGET
  💳 funding a hard-capped prepaid wallet (Stripe card — not crypto)…
  agent wallet (LemonCake Pay Token): $0.50 / daily cap $5
  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] $0.50
  policy: within cap → approved · it physically can't overspend
────────────────────────────────────────────────────────────
▌ Phase 3 — PAY  (autonomous — no human approves any of these)
  → call #01  402→paid $0.01 (Stripe)  ✓  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░] $0.49
  → call #02  402→paid $0.01 (Stripe)  ✓  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░] $0.48
  …
────────────────────────────────────────────────────────────
▌ Phase 4 — RESULT / STOP
  ✅ task ran on 50 paid calls · spent $0.50 of the $5 cap
  🛑 budget exhausted → the gateway returns x402 and the agent stops.
     0 overspend · 0 humans · 0 crypto · just a hard-capped card.
```

## Why this is different

Most "agents pay for APIs" demos settle in **USDC on-chain** — the agent needs a crypto wallet.

This one doesn't. The agent spends a **hard-capped prepaid card** behind [LemonCake](https://lemoncake.xyz)'s x402 gateway:

- **x402-native** — the API returns `402 + accepts[]`; the agent pays and retries, no human.
- **Hard-capped** — per-mint / daily / monthly limits, enforced server-side. The agent *cannot* overspend.
- **Custody-free, fiat** — Stripe Connect Direct Charge. No chain, no token, no wallet seed. The seller keeps 97%.

So any developer with a Stripe account — not just crypto-native ones — can let agents pay per call.

## Run it (30 seconds)

You need a LemonCake **Buyer Key** with a saved card (free: issue one at [/app](https://lemoncake.xyz/app) → Pay Tokens, save a card at [/agent/fund](https://lemoncake.xyz/agent/fund)).

```bash
BK=bk_your_key node agent-unleashed.mjs
```

Options:

```bash
BASE=https://www.lemoncake.xyz   # gateway
EP=vy3tteqe                      # the paid endpoint the agent calls
FUND_CENTS=50                    # how much to fund this task (Stripe min $0.50)
CAP_DOLLARS=5                    # the headline hard cap shown in the demo
CALL_DELAY_MS=600                # pacing for a clean recording
TASK="enrich my dataset with live market data"
```

> Cost: one real mint of `FUND_CENTS` (Stripe min $0.50). The per-call loop spends that prepaid balance — no extra charge. For a crisp 5-call GIF, point `EP` at a higher-priced endpoint (e.g. $0.10/call → $0.50 = 5 calls).

## How it maps to LemonCake

| Demo step | LemonCake mechanic |
|---|---|
| discover a paid tool | x402 `402 + accepts[]` (buyUrl + mintUrl) |
| fund a capped wallet | `POST /api/lc/agent/tokens` → off-session Stripe charge → Pay Token (JWT) |
| pay per call | `POST /g/<shortId>` with `Authorization: Bearer <jwt>` |
| can't overspend | per-mint / daily / monthly caps, server-enforced |
| stop at zero | gateway returns `402` when the prepaid budget is gone |

## Build the same for your API

Put any HTTP API behind a pay-per-call x402 gateway in minutes — no code changes:

1. Add your API at [lemoncake.xyz/app](https://lemoncake.xyz/app), set a price.
2. Share the gateway URL `/g/<shortId>`.
3. Agents pay per call, you keep 97%, first 3,000 calls free.

→ [lemoncake.xyz](https://lemoncake.xyz) · [agent-payment-mcp on npm](https://www.npmjs.com/package/agent-payment-mcp)

## License

MIT
