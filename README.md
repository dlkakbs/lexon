# Lexon

Self-hosted, policy-gated wallet operator for AI agents.

Lexon runs as a Telegram-based agent interface, uses OWS for delegated wallet access under user-defined rules, and executes actions on Base.

Built for the [OWS Hackathon 2026](https://docs.openwallet.sh/).

## What It Does

- Send USDC to an address or saved contact
- Swap ETH and USDC on Base
- Bridge from Base to 10+ EVM chains
- View multi-chain balances
- Score a Base wallet and inspect recent patterns
- Use text or voice in Telegram
- Apply delegated wallet access with OWS-based chain, spend, and contract controls
- Add memory, wallet intelligence, MoonPay, and monetizable capabilities over x402

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

and

`X402_EVM_PRIVATE_KEY=0x...`

Then use:

`/research Base vs Arbitrum stablecoin activity this week`

The remote endpoint should accept a `q` query parameter and return JSON.

## Notes

- OWS is the wallet and security layer. It gives the agent scoped wallet access and validates actions against your rules before signing.
- x402 adds both seller and buyer capability flows for agents.
- Tool-heavy queries are routed deterministically when possible: wallet risk and activity go to Allium, market research goes to a paid x402 research endpoint.
- Policy enforcement is strongest in agent mode with an OWS API key.

## License

MIT
