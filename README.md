# Lexon

**Self-hosted DeFi agent on Base — text or voice, policy-gated by OWS.**

Lexon is a Telegram bot that lets you send USDC, swap tokens, bridge cross-chain, and monitor your portfolio using plain language. Each person runs their own instance with their own OWS wallet and custom policy limits.

Built for the [OWS Hackathon 2026](https://docs.openwallet.sh/).

---

## How it works

```
User types or speaks → Whisper transcribes voice → Claude parses intent
       ↓
Honcho recalls user preferences + spending history
       ↓
OWS policy-gated wallet signs transaction (spend limits enforced)
       ↓
Transaction executes on Base mainnet
       ↓
XMTP notification sent to recipient
```

---

## Features

| Feature | Description |
|---|---|
| 💸 Send USDC | "Send 5 USDC to 0x742d..." or "Ali'ye 2 USDC gönder" |
| 🔄 Swap | ETH ↔ USDC via Uniswap V3, Universal Router, or Aerodrome |
| 🌉 Cross-chain Bridge | 17+ EVM chains via Li.Fi + OWS signing |
| 📊 Portfolio | Multi-chain portfolio, positions, PnL via Zerion |
| 💰 Balance | Native ETH + USDC balance on Base |
| 🎙 Voice commands | Send a Telegram voice note — Whisper transcribes it |
| 🧠 Personalized Memory | Honcho remembers your habits, named addresses, spending patterns |
| 🛡 OWS Policy | 8 configurable spend rules: per-tx, daily, cooldown, contract whitelist |
| 📩 XMTP notifications | Recipient gets wallet-native alert on payment |
| 💳 MoonPay on-ramp | Fund wallet without leaving Telegram |
| ⚙️ Self-hosted | Run your own instance — your keys, your wallet, your limits |

---

## Stack

| Tool | Role |
|---|---|
| **[OWS](https://docs.openwallet.sh/)** | Wallet management + policy-gated signing (8 rules) |
| **[Base](https://base.org/)** | L2 network — native USDC, fast finality |
| **[Claude](https://openrouter.ai/)** via OpenRouter / Anthropic / OpenAI | Intent parsing from natural language |
| **[Whisper](https://openai.com/research/whisper)** | Voice note transcription |
| **[Honcho](https://honcho.dev/)** | Personalized memory — user habits, named addresses, spending history |
| **[Zerion](https://zerion.io/)** | Multi-chain portfolio, positions, PnL, transaction history |
| **[Li.Fi](https://li.fi/)** | Cross-chain bridge — 17+ EVM chains, OWS-signed txs |
| **[XMTP](https://xmtp.org/)** | Wallet-native payment notifications to recipients |
| **[MoonPay](https://www.moonpay.com/)** | USDC on-ramp via `/fund` |
| **[Uniswap V3](https://uniswap.org/)** | ETH ↔ USDC swaps (SwapRouter02) |
| **[Uniswap Universal Router](https://uniswap.org/)** | Multi-hop swap routing |
| **[Aerodrome](https://aerodrome.finance/)** | Base-native DEX, alternative swap routing |
| **[viem](https://viem.sh/)** | Transaction construction and broadcasting |
| **[grammy](https://grammy.dev/)** | Telegram bot framework |
| **[Next.js](https://nextjs.org/)** | Landing page + Telegram webhook API route |

---

## Quick Start

### Option A: Interactive setup wizard

```bash
git clone https://github.com/dlkakbs/lexon
cd lexon
npm install
npx tsx setup.ts
```

The wizard walks you through every setting — API keys, wallet name, spend limits, AI model — and writes `.env.local` for you.

### Option B: Manual setup

**1. Clone & install**

```bash
git clone https://github.com/dlkakbs/lexon
cd lexon
npm install
```

**2. Create OWS wallet**

```bash
ows wallet create --name lexon-wallet
```

**3. Configure environment**

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
# Required
TELEGRAM_BOT_TOKEN=        # from @BotFather
OPENROUTER_API_KEY=        # openrouter.ai (default AI provider)
OPENAI_API_KEY=            # for Whisper voice transcription
OWS_WALLET_NAME=lexon-wallet
BASE_RPC_URL=https://mainnet.base.org

# Optional — enhanced features
XMTP_PRIVATE_KEY=          # EVM private key for XMTP notifications
HONCHO_API_KEY=             # honcho.dev — personalized memory
ZERION_API_KEY=             # zerion.io — multi-chain portfolio data
MOONPAY_API_KEY=            # moonpay.com — on-ramp

# AI model (default: openrouter + Claude Sonnet)
AI_PROVIDER=openrouter      # openrouter | anthropic | openai
AI_MODEL=anthropic/claude-sonnet-4-6

# OWS Policy limits
MAX_SEND_USDC=100           # max USDC per transaction
MAX_DAILY_USDC=100          # max USDC per day
MAX_SWAP_USD=100            # max swap value in USD (ETH or USDC)
OWS_MAX_TX_PER_DAY=20       # max transactions per day
OWS_COOLDOWN_SECONDS=30     # seconds between transactions
OWS_MAX_PER_ADDRESS_DAILY=50 # max USDC to a single address per day
OWS_CONFIRM_ABOVE_USDC=25   # ask confirmation above this amount
OWS_POLICY_EXPIRY=2027-01-01T00:00:00Z

# Supported chains (OWS eip155 format)
OWS_ALLOWED_CHAINS=eip155:8453,eip155:1,eip155:137,eip155:42161,eip155:10

# Extra contract whitelist (comma-separated, Uniswap/Aerodrome/Li.Fi already included)
# OWS_ALLOWED_CONTRACTS=0x...
```

**4. Run locally**

```bash
npx tsx dev-bot.ts
```

**5. Deploy to Vercel**

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
| `/portfolio` | Multi-chain portfolio summary (Zerion) |
| `/pnl` | 24h profit/loss across all positions |
| `/price` | Live ETH price |
| `/bridge` | Cross-chain bridge info + supported chains |
| `/policy` | Active OWS policy rules and limits |
| `/fund` | MoonPay on-ramp link |
| `/memory` | What Lexon remembers about you (Honcho) |
| `/update` | Pull latest version from git |

**Send allowlist**

| Command | Description |
|---|---|
| `/add 0x... [Label]` | Add address to send allowlist |
| `/remove 0x...` | Remove address from allowlist |
| `/list` | Show all allowed addresses |

**OWS Contract Whitelist**

| Command | Description |
|---|---|
| `/approve 0x... [Label]` | Add contract to OWS policy whitelist |
| `/unapprove 0x...` | Remove contract from whitelist |
| `/contracts` | List all approved contracts (trusted + user-added) |

### Natural Language

| Say... | Action |
|---|---|
| `"Send 5 USDC to 0x742d..."` | USDC transfer |
| `"Ali'ye 2 USDC gönder"` | Transfer to named contact |
| `"What's my balance?"` | Check wallet balance |
| `"Swap 0.001 ETH to USDC"` | ETH → USDC via Uniswap V3 |
| `"Swap 3 USDC to ETH on Aerodrome"` | USDC → ETH via Aerodrome |
| `"Bridge 10 USDC to Arbitrum"` | Cross-chain via Li.Fi |
| `"ETH fiyatı ne?"` | Live ETH price |
| `"Bu hafta ne harcadım?"` | Spending summary from memory |
| `"Portföyüm ne durumda?"` | Multi-chain portfolio |
| 🎙 Voice note of any of the above | Whisper transcribes + executes |

---

## OWS Policy — 8 Rules

Each Lexon instance enforces a policy built from your `.env.local`:

| Rule | Default | Env var |
|---|---|---|
| Allowed chains | 13 EVM chains | `OWS_ALLOWED_CHAINS` |
| Policy expiry | 2027-01-01 | `OWS_POLICY_EXPIRY` |
| Max USDC per tx | $100 | `MAX_SEND_USDC` |
| Max USDC per day | $100 | `MAX_DAILY_USDC` |
| Max tx per day | 20 | `OWS_MAX_TX_PER_DAY` |
| Cooldown between tx | 30s | `OWS_COOLDOWN_SECONDS` |
| Max per address/day | $50 | `OWS_MAX_PER_ADDRESS_DAILY` |
| Confirmation above | $25 | `OWS_CONFIRM_ABOVE_USDC` |

Contract whitelist is dynamic — Uniswap V3, Universal Router, Aerodrome, Li.Fi, and USDC are hardcoded trusted defaults. Add more via `/approve` or `OWS_ALLOWED_CONTRACTS`.

---

## Supported Bridge Chains (Li.Fi)

Base → Ethereum, Polygon, Arbitrum, Optimism, BNB Chain, Avalanche, zkSync Era, Linea, Scroll, Blast, Mantle, Unichain, Sonic, Berachain, Gnosis, Celo

---

## Project Structure

```
lib/
  config.ts          All settings from env vars
  wallet.ts          OWS wallet setup + policy building
  intent.ts          Multi-provider LLM intent parser
  bot.ts             Telegram bot command + message handlers
  memory.ts          Honcho personalized memory wrapper
  contracts.ts       OWS contract whitelist (trusted + user-added)
  allowlist.ts       Send allowlist management
  base.ts            viem Base client + USDC helpers
  voice.ts           Whisper voice transcription
  xmtp.ts            XMTP recipient notifications
  actions/
    send.ts          USDC send action
    balance.ts       Balance query action
    swap.ts          ETH ↔ USDC swap (Uniswap V3 / Universal / Aerodrome)
  skills/
    lifi.ts          Cross-chain bridge (Li.Fi + OWS signing)
    zerion.ts        Multi-chain portfolio, positions, PnL
    price.ts         Live ETH price
    moonpay.ts       Token search via MoonPay
setup.ts             Interactive setup wizard
dev-bot.ts           Local polling mode for development
test-integrations.ts Integration tests for all external APIs
```

---

## License

MIT
