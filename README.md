# AgentGate (Colosseum edition)

AgentGate lets a site owner charge AI agents for reading their content, instead of hoping they honor `robots.txt`.
An unpaid agent gets an HTTP 402 with a price. A paying agent gets the page and a receipt. The owner sees who read
what, what they paid, and what was blocked.

This edition settles in **USDC on Base** (Base Sepolia by default).

## What is in the repo

| Path | What it is |
|---|---|
| `apps/dashboard` | Owner dashboard: services, per-agent rules (Free, Charge, Block), live analytics, wallet, ERC-8004 identity, invoices |
| `apps/maplelabs-bot` | MapleLabsBot, a test crawler with Search and Train modes. It hits a gated blog, reads the 402, and pays from a buyer wallet after you click Approve |

## Run it

```bash
# dashboard
cd apps/dashboard && npm install && npm run dev      # http://localhost:5173

# demo crawler
cd apps/maplelabs-bot && node server.mjs             # http://localhost:5180
```

## Configuration

Everything has a safe default (Base Sepolia, no real money). Override with env vars.

Dashboard (`apps/dashboard/.env.local`):

| Variable | Purpose |
|---|---|
| `VITE_BASE_NETWORK` | `mainnet` to use Base mainnet. Default is Base Sepolia |
| `VITE_BASE_RPC_URL` | Custom Base RPC |
| `VITE_RECEIVE_ADDRESS` | Address that receives USDC |
| `VITE_IDENTITY_REGISTRY`, `VITE_REPUTATION_REGISTRY` | ERC-8004 registries. The defaults are live on Base Sepolia. Set both for mainnet |
| `VITE_INVOICE_AGENT_ID` | Your ERC-8004 agent id on Base. Register it from the Identity tab, then set this. Until then no agent is shown as verified |
| `VITE_BLOG_ANALYTICS_KEY` | Key for the blog analytics endpoint |

Demo crawler (`apps/maplelabs-bot/.env.local`, gitignored): `BUYER_WALLET_PRIVATE_KEY`, `BUYER_WALLET_ADDRESS`,
`SELLER_WALLET_ADDRESS`, `BASE_NETWORK`, `BASE_RPC_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ADMIN_KEY`.
The buyer key never leaves the server and is only used after Approve. See `apps/maplelabs-bot/README.md`.

## How payment works on Base

1. An agent requests a gated page and gets HTTP 402 with the price.
2. The buyer wallet signs a USDC transfer to the seller address on Base.
3. The gate accepts the paid request and the dashboard records it with a link to BaseScan.
4. Agent identity uses the ERC-8004 identity registry on Base.

## Pre-existing work

This repository is a fork of [dhru7777/AgentGate](https://github.com/dhru7777/AgentGate), which was built for a
different hackathon. The full history is kept. The first commit is dated 2026-10-01, before this event.

Changes made for this event:

- Settlement and identity moved to Base. Balance and transfer history now read from Base RPC and Blockscout.
- The bot pays USDC on Base and its prompts and UI were updated to match.
- The earlier passkey sign-in and the other chain and wallet integrations were removed. The wallet view now shows the configured receive address.
- The ERC-8004 invoice agent id is now configuration, so the UI never shows another wallet's agent as yours.

## AI tool disclosure

Built with Claude Code (Anthropic) for drafting and refactoring, reviewed by the team. MapleLabsBot can use Claude or
OpenAI as its brain; payment in the demo is a real testnet transfer only after a person clicks Approve.
