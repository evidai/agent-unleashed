# Launch assets — Agent Unleashed

> Record the terminal (black bg, white text) → GIF (~8–12s loop, no BGM). Lead with the GIF.

## X / Twitter thread

**1/**
I gave an AI agent a hard-capped card and let it loose on the internet.

It found a paid API, paid for every call itself via x402, and stopped the second the budget ran out.

No human. No API key. And — unlike every other demo — **no crypto.**

🧵👇 [GIF]

**2/**
Every "agent pays for APIs" demo you've seen settles in USDC on-chain. The agent needs a crypto wallet.

This one spends a **hard-capped prepaid card** (Stripe). No chain, no token, no seed phrase.

x402, but fiat. Any dev with a Stripe account can do this.

**3/**
The loop:
→ discover a paid tool (MCP)
→ check its own capped wallet
→ get 402, pay $0.01, retry — on its own
→ budget hits zero → it stops. It physically can't overspend.

Caps are server-side (per-mint / daily / monthly).

**4/**
Built on @LemonCake_xyz — an x402 gateway for AI agents. Custody-free, seller keeps 97%, first 3,000 calls free.

Repo (MIT) + `npx agent-payment-mcp`:
[github link]

Question for API/MCP devs: if your endpoint were pay-per-call x402, what daily cap would you give an agent? 👀

## HN / Reddit titles

- `Show HN: An AI agent that pays for APIs with a hard-capped fiat card via x402 (no crypto)`
- `I let an AI agent loose with a hard-capped card — it pays for APIs and stops at $0 (x402, Stripe, no crypto)`

## Hashtags
`#x402 #MCP #AIAgents #AgenticPayments #APIDevelopers`

## Posting notes
- Weekday evening JST (18–22h) overlaps active AI/dev hours.
- The differentiator to hammer in the caption: **fiat / no crypto / hard-capped**. That's the open lane — the famous demos (e.g. svpino, Apr 2026) are all USDC.
- Honest framing: this is a working demo from a pre-revenue project. Don't overclaim adoption.
