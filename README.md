# Lexon

Self-hosted, policy-gated DeFi agent on Base.

Lexon is a Telegram bot that lets you send USDC, swap, bridge, and track your portfolio with plain language. Each user runs their own instance with their own OWS wallet and their own limits.

Built for the [OWS Hackathon 2026](https://docs.openwallet.sh/).

## What It Does

- Send USDC to an address or saved contact
- Swap ETH and USDC on Base
- Bridge from Base to 17+ EVM chains
- View multi-chain portfolio and PnL
- Use text or voice in Telegram
- Apply OWS-based chain, spend, and contract controls
- Add optional memory, MoonPay, and x402 capability support

## Stack

- OWS for wallet access and policy-gated signing
- Base for execution
- Li.Fi for bridging
- Zerion for portfolio data
- OpenRouter, Anthropic, or OpenAI for intent parsing
- Whisper for voice transcription
- Honcho for optional memory
- MoonPay for optional on-ramp
- x402 for optional paid capabilities
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
- `/portfolio` - holdings and positions
- `/pnl` - 24h profit and loss
- `/price` - ETH price
- `/bridge` - bridge info
- `/policy` - active limits
- `/catalog` - optional x402 catalog
- `/fund` - MoonPay on-ramp
- `/memory` - saved memory summary

## Notes

- OWS is the security layer. It controls what the agent can sign.
- x402 is optional. Lexon works without it.
- Policy enforcement is strongest in agent mode with an OWS API key.

## License

MIT
