# Lexon

**DeFi on Base via natural language — text or voice, no wallet setup required.**

Lexon is a Telegram bot that lets you send USDC, check balances, and interact with Base mainnet using plain English (or any language). Powered by OWS wallet infrastructure, Claude AI, and Whisper voice transcription.

Built for the [OWS Hackathon 2026](https://docs.openwallet.sh/).

---

## How it works

```
User types or speaks → Whisper transcribes voice → Claude parses intent
       ↓
OWS policy-gated wallet signs transaction
       ↓
Transaction executes on Base mainnet
       ↓
XMTP notification sent to recipient
```

---

## Features

| Feature | Description |
|---|---|
| 💸 Send USDC | "Send 2 USDC to 0x742d..." |
| 💰 Check balance | "What's my balance?" |
| 🎙 Voice commands | Send a Telegram voice note |
| 🛡 Allowlist | Only send to pre-approved addresses |
| 📩 XMTP notifications | Recipient gets wallet-native alert |
| 💳 MoonPay on-ramp | Fund wallet without leaving Telegram |
| ⚙️ Policy limits | Max $2/tx · $10/day enforced by OWS |

---

## Stack

| Tool | Role |
|---|---|
| **[OWS](https://docs.openwallet.sh/)** | Wallet management, policy-gated signing, API keys |
| **[Base](https://base.org/)** | L2 network — native USDC gas, fast finality |
| **[Claude](https://openrouter.ai/)** via OpenRouter | Parses "send 2 USDC to 0x..." into structured actions |
| **[Whisper](https://openai.com/research/whisper)** | Transcribes Telegram voice notes to text |
| **[XMTP](https://xmtp.org/)** | Sends wallet-native payment notifications to recipients — when you send USDC, the recipient's wallet address gets a message: "You received $2 USDC" (visible in Coinbase Wallet, Converse, etc.) |
| **[MoonPay](https://www.moonpay.com/)** | USDC on-ramp via `/fund` — buy USDC directly into the Lexon wallet |
| **[Uniswap V3](https://uniswap.org/)** | ETH ↔ USDC swaps on Base (SwapRouter02) |
| **[Uniswap Universal Router](https://uniswap.org/)** | Multi-hop swap routing |
| **[Aerodrome](https://aerodrome.finance/)** | Base-native DEX, alternative swap routing |
| **[viem](https://viem.sh/)** | Base transaction construction and broadcasting |
| **[grammy](https://grammy.dev/)** | Telegram bot framework |
| **[Next.js](https://nextjs.org/)** | Landing page + Telegram webhook API route |

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/dlkakbs/lexon
cd lexon
npm install
```

### 2. Create OWS wallet

```bash
ows wallet create --name lexon-wallet
```

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
TELEGRAM_BOT_TOKEN=        # from @BotFather
OPENROUTER_API_KEY=        # openrouter.ai
OPENAI_API_KEY=            # for Whisper voice transcription
XMTP_PRIVATE_KEY=          # EVM private key for XMTP notifications
OWS_WALLET_NAME=lexon-wallet
BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 4. Run locally (polling mode)

```bash
npx tsx dev-bot.ts
```

### 5. Deploy to Vercel

```bash
vercel --prod
```

Set webhook:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/api/webhook
```

---

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Introduction and onboarding |
| `/help` | Full command reference |
| `/wallet` | Show Lexon wallet address + Basescan link |
| `/fund` | Get MoonPay link to buy USDC directly into wallet |
| `/list` | Show all allowed addresses (trusted DEXes + personal) |
| `/allow 0x... Label` | Add an address to the allowlist |
| `/remove 0x...` | Remove an address from the allowlist |

### Natural Language Commands

| Say... | Action |
|---|---|
| `"Send 2 USDC to 0x742d..."` | USDC transfer |
| `"What's my balance?"` | Check wallet balance |
| `"Check balance of 0x..."` | Check any address |
| `"Swap 0.001 ETH to USDC"` | ETH → USDC via Uniswap V3 |
| `"Swap 3 USDC to ETH on Aerodrome"` | USDC → ETH via Aerodrome |
| `"Swap ETH to USDC via Uniswap Universal"` | Multi-hop swap |
| 🎙 Voice note of any of the above | Whisper transcribes + executes |

---

## Security

- **OWS policy** — Transactions restricted to Base mainnet only, expiry enforced
- **App-layer limits** — Max $2 USDC per transaction, $10 USDC per day
- **Allowlist** — Transactions only sent to pre-approved addresses (DEXes + personal)
- **Trusted DEXes** — Uniswap V3, Uniswap Universal Router, Aerodrome hardcoded

---

## Project Structure

```
lib/
  wallet.ts          OWS wallet setup + signing
  base.ts            viem Base client + USDC helpers
  intent.ts          Claude intent parser (OpenRouter)
  voice.ts           Whisper voice transcription
  bot.ts             Telegram bot handlers (production)
  allowlist.ts       Address allowlist management
  xmtp.ts            XMTP recipient notifications
  actions/
    send.ts          USDC send action
    balance.ts       Balance query action
app/
  page.tsx           Landing page
  api/webhook/       Telegram webhook endpoint
dev-bot.ts           Local polling mode for development
```

---

## License

MIT
