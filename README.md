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

- OWS for wallet management, scoped agent access, policy validation, and signing
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

## Quick Start

```bash
git clone https://github.com/dlkakbs/lexon
cd lexon
npm install
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

To deploy the web app:

```bash
vercel --prod
```

After deployment, set the Telegram webhook to your `/api/webhook` route.

## Commands

- `/start` - intro
- `/help` - command list
- `/wallet` - wallet address
- `/portfolio` - multi-chain balances
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

Lexon exposes a live paid bridge preflight capability over x402.

`/api/x402/paid/evaluate-bridge?fromChain=base&toChain=arbitrum&fromToken=USDC&amount=10`

and a paid research capability:

`/api/x402/paid/research?q=base%20stablecoin%20activity%20this%20week`

It returns:

- allow or deny
- matched policy rules
- route and fee estimate
- what would execute if approved

Any agent can call this endpoint and pay via x402.

## x402 Buyer

Lexon can also buy remote paid capabilities over x402. The first built-in buyer flow is paid market research.

Set:

`X402_REMOTE_RESEARCH_URL=https://...`

Then use:

`/research Base vs Arbitrum stablecoin activity this week`

The remote endpoint should accept a `q` query parameter and return JSON.

If `X402_REMOTE_RESEARCH_URL` is not set, Lexon falls back to:

`NEXT_PUBLIC_APP_URL/api/x402/paid/research`

For local testing, run the web app too:

```bash
npm run dev
```

In local development, paid x402 routes fall back to direct responses so you can test buyer and seller flows without a live facilitator. Production keeps the x402 paywall enabled.

## Notes

- OWS is the wallet and security layer. It gives the agent scoped wallet access and validates actions against your rules before signing.
- x402 adds both seller and buyer capability flows for agents.
- x402 buyer payments use the same OWS-managed wallet and policy-gated signing flow.
- Tool-heavy queries are routed deterministically when possible: wallet risk and activity go to Allium, market research goes to a paid x402 research endpoint.
- Policy enforcement is strongest in agent mode with an OWS API key.
- Wallet, admin, and paid buyer flows should be restricted with `TELEGRAM_OWNER_IDS`.

## License

MIT
