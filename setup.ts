#!/usr/bin/env npx tsx
/**
 * Lexon Setup — interactive first-run wizard.
 * Run: npx tsx setup.ts
 */

import * as readline from "readline";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (q: string, defaultVal = ""): Promise<string> =>
  new Promise((resolve) => {
    const hint = defaultVal ? ` [${defaultVal}]` : "";
    rl.question(`${q}${hint}: `, (ans) => resolve(ans.trim() || defaultVal));
  });

const askSecret = (q: string): Promise<string> =>
  new Promise((resolve) => {
    process.stdout.write(`${q}: `);
    // Hide input on supported terminals
    if (process.stdin.isTTY) {
      (process.stdin as any).setRawMode?.(true);
      let input = "";
      const onData = (ch: Buffer) => {
        const char = ch.toString();
        if (char === "\r" || char === "\n") {
          (process.stdin as any).setRawMode?.(false);
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(input);
        } else if (char === "\u0003") {
          process.exit();
        } else if (char === "\u007f") {
          input = input.slice(0, -1);
        } else {
          input += char;
          process.stdout.write("*");
        }
      };
      process.stdin.on("data", onData);
    } else {
      rl.question("", (ans) => resolve(ans.trim()));
    }
  });

function hr() {
  console.log("\n" + "─".repeat(50) + "\n");
}

function ok(msg: string) {
  console.log(`✅ ${msg}`);
}

function info(msg: string) {
  console.log(`ℹ  ${msg}`);
}

function warn(msg: string) {
  console.log(`⚠️  ${msg}`);
}

function step(n: number, total: number, title: string) {
  console.log(`\n[${n}/${total}] ${title}`);
  console.log("─".repeat(40));
}

async function main() {
  console.clear();
  console.log("╔══════════════════════════════════════════╗");
  console.log("║          LEXON — Setup Wizard            ║");
  console.log("║  DeFi agent powered by OWS + Telegram   ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();
  console.log("Bu sihirbaz seni adım adım Lexon kurulumuna götürecek.");
  console.log("Her adımda Enter'a basarak varsayılan değeri kabul edebilirsin.");

  const TOTAL = 7;

  // ── 1. Telegram ──────────────────────────────────────────────────────────
  step(1, TOTAL, "Telegram Bot Token");
  info("@BotFather'a git → /newbot → token'ı kopyala");
  info("https://t.me/BotFather");
  const telegramToken = await askSecret("TELEGRAM_BOT_TOKEN");
  if (!telegramToken) { warn("Telegram token zorunlu!"); process.exit(1); }

  // ── 2. OpenRouter ─────────────────────────────────────────────────────────
  step(2, TOTAL, "OpenRouter API Key (intent parsing için Claude)");
  info("https://openrouter.ai → API Keys → Create Key");
  const openrouterKey = await askSecret("OPENROUTER_API_KEY");
  if (!openrouterKey) { warn("OpenRouter key zorunlu!"); process.exit(1); }

  // ── 3. OpenAI (Whisper) ───────────────────────────────────────────────────
  step(3, TOTAL, "OpenAI API Key (sesli komut için Whisper)");
  info("https://platform.openai.com/api-keys");
  info("Sesli komutu kullanmayacaksan Enter'la geç.");
  const openaiKey = await askSecret("OPENAI_API_KEY");

  // ── 4. OWS Wallet ─────────────────────────────────────────────────────────
  step(4, TOTAL, "OWS Wallet — policy gate oluştur");
  const walletName = await ask("Cüzdan adı", "lexon-wallet");

  let walletAddress = "";
  try {
    info(`"${walletName}" cüzdanı oluşturuluyor...`);
    execSync(`ows wallet create --name ${walletName}`, { stdio: "pipe" });
    const out = execSync(`ows wallet show --name ${walletName} --json`, { stdio: "pipe" }).toString();
    walletAddress = JSON.parse(out)?.address ?? "";
    ok(`Cüzdan oluşturuldu${walletAddress ? `: ${walletAddress}` : ""}`);
  } catch {
    warn("OWS CLI bulunamadı veya cüzdan zaten var — devam ediliyor.");
  }

  // ── 5. Policy limitleri ───────────────────────────────────────────────────
  step(5, TOTAL, "OWS Policy kuralları");
  info("Bunlar OWS policy gate'ine yazılır. Her kural bir güvenlik katmanı ekler.");
  console.log();
  const maxSend    = await ask("Max USDC / işlem (max_value_per_tx)",  "50");
  const maxDaily   = await ask("Max USDC / gün  (max_value_per_day)",  "100");
  const maxEth     = await ask("Max ETH / swap",                        "0.01");
  const maxSwap    = await ask("Max USDC / swap",                       "10");
  const chains     = await ask("İzin verilen chain ID'leri (allowed_chains)", "eip155:8453");
  const expiry     = await ask("Policy expiry tarihi (expires_at)",     "2027-01-01T00:00:00Z");
  const contracts  = await ask("İzin verilen contract adresleri (allowed_contracts, boş=hepsi)", "");
  const confirmAmt = await ask("Bu USDC'nin üstünde onay iste (require_confirmation, 0=kapalı)", "0");

  // ── 6. AI Model seçimi ────────────────────────────────────────────────────
  step(6, TOTAL, "AI Model seçimi");
  info("Hangi provider'ı kullanmak istiyorsun?");
  console.log("  1) openrouter  — 200+ model, tek key (önerilen)");
  console.log("  2) anthropic   — Claude direkt API");
  console.log("  3) openai      — GPT-4o / GPT-4o-mini");
  console.log();
  const providerChoice = await ask("Provider (1/2/3)", "1");
  const providerMap: Record<string, string> = { "1": "openrouter", "2": "anthropic", "3": "openai" };
  const aiProvider = providerMap[providerChoice] ?? "openrouter";

  let aiModel = "";
  let aiKeyName = "";
  let aiKeyVal = "";

  if (aiProvider === "openrouter") {
    aiModel   = await ask("Model", "anthropic/claude-sonnet-4-6");
    aiKeyName = "OPENROUTER_API_KEY";
    aiKeyVal  = process.env.OPENROUTER_API_KEY ?? openrouterKey;
    info("Diğer model örnekleri: openai/gpt-4o-mini · google/gemini-2.0-flash");
  } else if (aiProvider === "anthropic") {
    aiModel   = await ask("Model", "claude-sonnet-4-6");
    aiKeyName = "ANTHROPIC_API_KEY";
    aiKeyVal  = await askSecret("ANTHROPIC_API_KEY");
    info("https://console.anthropic.com/settings/keys");
  } else {
    aiModel   = await ask("Model", "gpt-4o-mini");
    aiKeyName = "OPENAI_API_KEY";
    aiKeyVal  = process.env.OPENAI_API_KEY ?? openaiKey;
  }

  // ── 7. Opsiyonel servisler ────────────────────────────────────────────────
  step(7, TOTAL, "Zerion API Key (portföy & DeFi verisi) — opsiyonel");
  info("https://dashboard.zerion.io → ücretsiz plan var");
  const zerionKey = await askSecret("ZERION_API_KEY (boş bırakılabilir)");

  step(7, TOTAL, "Honcho API Key (kişiselleştirilmiş hafıza) — opsiyonel");
  info("https://app.honcho.dev → $100 ücretsiz kredi");
  const honchoKey = await askSecret("HONCHO_API_KEY (boş bırakılabilir)");

  // ── 7. .env.local yaz ─────────────────────────────────────────────────────
  step(7, TOTAL, ".env.local dosyası oluşturuluyor");

  const moonpayApiKey = process.env.MOONPAY_API_KEY ?? "";

  const envContent = `# Telegram
TELEGRAM_BOT_TOKEN=${telegramToken}

# AI Model
AI_PROVIDER=${aiProvider}
AI_MODEL=${aiModel}
${aiKeyName}=${aiKeyVal}

# OpenAI (Whisper voice transcription — always needed for voice commands)
OPENAI_API_KEY=${openaiKey}

# Base Mainnet
BASE_RPC_URL=https://mainnet.base.org

# OWS Wallet
OWS_WALLET_NAME=${walletName}

# XMTP (leave empty to skip recipient notifications)
XMTP_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OWS Policy rules
MAX_SEND_USDC=${maxSend}
MAX_DAILY_USDC=${maxDaily}
MAX_SWAP_ETH=${maxEth}
MAX_SWAP_USDC=${maxSwap}
OWS_ALLOWED_CHAINS=${chains}
OWS_POLICY_EXPIRY=${expiry}
${contracts ? `OWS_ALLOWED_CONTRACTS=${contracts}` : "# OWS_ALLOWED_CONTRACTS=0x...,0x...  (empty = all contracts allowed)"}
OWS_CONFIRM_ABOVE_USDC=${confirmAmt}

# MoonPay (on-ramp + cross-chain bridge)
MOONPAY_API_KEY=${moonpayApiKey}
MOONPAY_WALLET_NAME=${walletName}

# Zerion (portfolio & DeFi data)
ZERION_API_KEY=${zerionKey}

# Honcho (personalized memory)
HONCHO_API_KEY=${honchoKey}
`;

  const envPath = path.join(process.cwd(), ".env.local");
  const backup  = fs.existsSync(envPath);
  if (backup) fs.copyFileSync(envPath, envPath + ".backup");
  fs.writeFileSync(envPath, envContent);
  ok(`.env.local yazıldı${backup ? " (eski dosya .env.local.backup'a kopyalandı)" : ""}`);

  // ── Tamamlandı ─────────────────────────────────────────────────────────────
  hr();
  console.log("🎉 Kurulum tamamlandı!\n");
  if (walletAddress) {
    console.log(`💳 Cüzdan adresi: ${walletAddress}`);
    console.log(`   Bu adrese Base mainnet'ten USDC gönder.\n`);
  }
  console.log("Botu başlatmak için:");
  console.log("  npx tsx dev-bot.ts\n");
  console.log("Telegram'da /start yaz ve başla!");
  hr();

  rl.close();
}

main().catch((err) => {
  console.error("Setup hatası:", err.message);
  process.exit(1);
});
