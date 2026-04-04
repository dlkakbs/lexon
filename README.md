# Lexon

Self-hosted, policy-gated wallet operator for AI agents.

Lexon runs as a Telegram-based agent interface, uses OWS for delegated wallet access under user-defined rules, and executes actions on Base.

Built for the [OWS Hackathon 2026](https://docs.openwallet.sh/).

## What It Does

- Send USDC on Base
- Swap ETH and USDC on Base
- Bridge from Base to supported chains
- View wallet balances and activity
- Score Base wallets and inspect patterns
- Run through Telegram with text or voice
- Enforce delegated wallet access with OWS before signing
- Expose and buy monetizable capabilities over x402

## Stack

- OWS for local wallet storage, scoped agent access, policy validation, and signing
- Base for execution
- Li.Fi for bridging
- Zerion for portfolio data
- Allium for wallet activity and Base intelligence
- OpenRouter, Anthropic, or OpenAI for intent parsing
- Whisper for voice transcription
- Honcho for optional memory
- MoonPay for optional on-ramp
- x402 for monetizable capabilities
- Next.js and grammy for the app and bot

## How OWS Works Here

OWS is the wallet and policy layer. The agent never holds keys directly — it requests signing through OWS, which validates each transaction against user-defined rules before it signs.

Two modes:

- **Agent mode** (`OWS_API_KEY` set) — every transaction goes through the policy before signing. This is the intended production mode.
- **Owner mode** (empty key) — policy is bypassed. Development only.

OWS provides two built-in declarative rules out of the box:

- `allowed_chains` — restricts signing to specific CAIP-2 chain IDs
- `expires_at` — time-bounds the API key

Everything else is enforced by a custom policy executable (`policy/spend_limit.js`). OWS pipes a `PolicyContext` JSON to it on stdin before every signing operation and expects a `PolicyResult` on stdout. The executable adds:

- **Contract allowlist** — only pre-approved DEXes and bridges can be called
- **USDC per-tx cap** — decoded directly from ERC-20 calldata (`transfer(address,uint256)`)
- **ETH per-tx cap** — checked against the raw transaction value in wei
- **Daily ETH cap** — accumulated using OWS-native `spending.daily_total`

Users can approve additional contracts at runtime via `/approve` without restarting or re-registering the policy. The executable reads `data/contracts.json` live on each evaluation.

## Quick Start

```bash
git clone https://github.com/dlkakbs/lexon
cd lexon
npm install
cp .env.example .env.local   # fill in your keys
npx tsx setup.ts
```

Then run the bot:

```bash
npx tsx dev-bot.ts
```

If you want a direct terminal command instead of `npx tsx dev-bot.ts`, run this once:

```bash
npm link
```

Then you can start Lexon with:

```bash
lexon
```

or:

```bash
lexon-gateway
```

Set `TELEGRAM_OWNER_IDS` in `.env.local` to the Telegram user IDs allowed to use wallet, admin, and paid buyer flows.


## Commands

- `/start` - intro
- `/help` - command list
- `/wallet` - wallet address
- `/portfolio` - multi-chain balances
- `/chainbalance <chain>` - balance on a specific chain
- `/scorewallet` - Base wallet activity score
- `/walletpatterns` - Base wallet patterns
- `/price` - ETH price
- `/bridge` - bridge info
- `/policy` - active limits
- `/audit` - recent policy decisions
- `/catalog` - x402 capability catalog
- `/research <query>` - buy paid market research over x402
- `/fund` - MoonPay on-ramp
- `/memory` - saved memory summary

## x402 Capability

Lexon includes x402 seller and buyer flows.

**Seller:** Routes are wrapped with `withX402` from `@x402/next`. In production, callers must pay before the handler runs. In local dev, the paywall is bypassed so you can test without sending real payments.

Seller capability:

`/api/x402/paid/evaluate-bridge?fromChain=base&toChain=arbitrum&fromToken=USDC&amount=10`

This returns:

- allow or deny
- matched policy rules
- route and fee estimate
- what would execute if approved

To expose your own paid capability:

- run the web app
- publish your Lexon URL
- share the endpoint from `/api/x402/catalog`

The research route is included as a demo capability for local development and buyer-flow testing. It is not the main public seller surface.

## x402 Buyer

Lexon can also buy remote paid capabilities over x402. The first built-in buyer flow is paid market research.

**Buyer payments go through the same OWS-managed wallet and policy-gated signing flow as regular transactions.** There is no separate private key for x402 — the agent signs EIP-712 typed data via OWS.

Built-in flow:

`/research Base vs Arbitrum stablecoin activity this week`

To connect a real paid endpoint:

- set `X402_REMOTE_RESEARCH_URL` in `.env.local`
- point it to a compatible remote research capability
- restart Lexon

For demo/testing, Lexon also includes a local research capability.

## Notes

- OWS is the wallet and security layer. It gives the agent scoped wallet access and validates actions against your rules before signing.
- x402 adds both seller and buyer capability flows for agents.
- x402 buyer payments use the same OWS-managed wallet and policy-gated signing flow.
- Tool-heavy queries are routed deterministically when possible: wallet risk and activity go to Allium, market research goes to a paid x402 research endpoint.
- Policy enforcement is strongest in agent mode with an OWS API key.
- Wallet, admin, and paid buyer flows should be restricted with `TELEGRAM_OWNER_IDS`.

NEXT STEP: XMPT (Trusted agentic messaging) 

## License

MIT
