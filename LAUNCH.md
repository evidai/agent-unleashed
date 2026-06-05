# Launch assets — Agent Unleashed (AI edition)

Two assets, two jobs:
- **Hero GIF** = the script (`agent-ai.mjs`) — watchable, nothing collapsed.
- **Proof screenshot** = a real MCP agent (Claude Desktop) calling `call_paid_api`,
  tool card EXPANDED so the `charge: "0.01"` is visible. Defuses "it's just a curl loop."

> Record the terminal: black bg, ≥90 cols (no wrap), font ≥16pt. 8–12s loop, no BGM. Lead with the GIF.
> What the agent buys = **paid LLM inference** (regex, SQL, git, a fix) it can't do itself — the seller's key, not the agent's.
> NOT free data. Real cost upstream (OpenRouter). That's why "lol it's free" doesn't land.

---

## X / Twitter thread

**1/**
I gave an AI agent a credit card and let it loose.

It hit a paid API six times, paid for every call by itself, and stopped the second it hit its cap.

No human. No shared key. And — unlike every other agent-payments demo — **no crypto.**

🧵 [GIF]

**2/**
What did it buy? Things it *can't* do itself — paid LLM inference behind someone else's key:

→ a regex
→ a one-liner to find files >100MB
→ a SQL query
→ a cron expression
→ the git command to undo a commit

$0.01 each. No subscription. No key of its own.

**3/**
Every "agent pays for APIs" demo settles in USDC on-chain — the agent needs a wallet, a seed phrase, a chain.

This one spends a **hard-capped prepaid card** (Stripe). No token, no gas, no seed.

x402 — but fiat. Any dev with a Stripe account can be on the *receiving* end.

**4/**
The part nobody shows: the **API owner gets paid on every call, automatically.**

6 calls → the owner earned $0.058. No invoice. No chasing.

Now do the math on 10,000 agent-customers a day hitting your endpoint. 👀

**5/**
"What stops it draining the card?" The cap. Server-side, per-mint/daily/monthly. It *physically can't* overspend — budget hits zero, gateway returns 402, it stops.

Built on LemonCake — custody-free, seller keeps 97%, first 3,000 calls free.
No license needed to run it. (Ask me why.)

Repo (MIT) + `npx agent-payment-mcp`: [github link]

If agents could pay your endpoint per call — what would you charge? 👇

---

## HN / Reddit titles

- `Show HN: An AI agent that pays for API calls with a hard-capped fiat card via x402 (no crypto)`
- `I gave an AI agent a capped credit card — it bought regex, SQL and git answers per call and stopped at $0`
- `x402 but fiat: agents pay per call with a prepaid card, API owners keep 97%`

## Hashtags
`#x402 #MCP #AIAgents #AgenticPayments #buildinpublic`

---

## What we leave open on purpose (drives replies)

- **End on a question** ("what would you charge?") — replies > likes for reach.
- **Don't finish the scale math** — "10,000 a day 👀", let people post their own numbers.
- **"No license needed (ask me why)"** — leave unexplained. The FSA reasoning is real; the gap is bait.
- **"No crypto"** is the fight-starter — the whole x402 space is USDC. Don't justify it; let crypto people argue in QTs.
- **Don't over-explain custody/safety** — plant "the cap stopped it," let them wonder "what if it hadn't?"

## Two kinds of 炎上 — court one, avoid the other
- ✅ **Positioning fights** (fiat vs crypto, per-call vs subscription) = rocket fuel. You look bold.
- ❌ **Competence dunks** ("you're paying for free data / this isn't safe") = lethal for a payments brand.
  → That's why the agent buys PAID inference (real cost), and the copy leads with the RAIL + the CAP.

## Honesty guardrails
- Pre-revenue project, working demo. Don't fake adoption numbers.
- Real: real gateway, real 97% split, real hard cap, real paid LLM calls upstream.
- **"real card / real money"** is only true if Stripe is in LIVE mode. If it's test mode, say "test mode" — do not claim real money. (Verify in Stripe before posting.)
- The "agent" in the GIF is a script visualizing the rail; the **proof screenshot** is the real MCP agent paying. Show both.
