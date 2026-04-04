#!/usr/bin/env npx tsx
/**
 * Lexon Setup — interactive first-run wizard.
 * Run: npx tsx setup.ts
 */

import * as readline from "readline";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import {
  createWallet,
  listWallets,
  createPolicy,
  deletePolicy,
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "@open-wallet-standard/core";

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

  // ── 4. OWS Wallet + Policy + API Key ─────────────────────────────────────
  step(4, TOTAL, "OWS Wallet + Policy + API Key");
  info("OWS policy sadece API key (agent) modunda enforce edilir.");
  info("Bu adım cüzdanı oluşturur, spend policy'sini kaydeder ve bir API key üretir.");
  console.log();

  const walletName       = await ask("Cüzdan adı", "lexon-wallet");
  const walletPassphrase = await askSecret("Cüzdan parolası (yoksa Enter'a bas)");

  // Create wallet (ignore error if already exists)
  let walletId = "";
  let walletAddress = "";
  try {
    let wallet = listWallets().find((w: any) => w.name === walletName);
    if (!wallet) {
      info(`"${walletName}" cüzdanı oluşturuluyor...`);
      wallet = createWallet(walletName, walletPassphrase || undefined);
    } else {
      info(`"${walletName}" cüzdanı zaten mevcut, kullanılıyor.`);
    }
    walletId = wallet.id;
    const evm = wallet.accounts?.find((a: any) =>
      a.chainId === "eip155:8453" || a.chainId?.startsWith("eip155")
    );
    walletAddress = evm?.address ?? wallet.accounts?.[0]?.address ?? "";
    ok(`Cüzdan hazır${walletAddress ? `: ${walletAddress}` : ""}`);
  } catch (e: any) {
    warn(`Cüzdan oluşturulamadı: ${e.message} — devam ediliyor.`);
  }

  // Write policy executable (ensure it's executable)
  const policyDir = path.join(process.cwd(), "policy");
  const executablePath = path.join(policyDir, "spend_limit.js");
  if (!fs.existsSync(executablePath)) {
    warn("policy/spend_limit.js bulunamadı — önce build yapıldığından emin ol.");
  } else {
    try { execSync(`chmod +x "${executablePath}"`); } catch {}
  }

  // ── 5. Policy limitleri ───────────────────────────────────────────────────
  step(5, TOTAL, "Spend Guard limitleri");
  info("OWS executable policy (policy/spend_limit.js) şu limitleri enforce eder:");
  info("  • USDC per-tx cap  → OWS custom executable (ERC-20 data decode)");
  info("  • ETH per-tx cap   → OWS custom executable (transaction.value)");
  info("  • Daily ETH cap    → OWS custom executable (spending.daily_total)");
  info("  • Contract whitelist → OWS custom executable");
  info("  • USDC daily cap, cooldown → app-layer (OWS daily_total tracks ETH only)");
  console.log();
  const maxSend    = await ask("Max USDC / işlem",                      "100");
  const maxDaily   = await ask("Max USDC / gün (app-layer)",            "100");
  const maxEthTx   = await ask("Max ETH / işlem (OWS enforces)",        "0.05");
  const maxSwap    = await ask("Max USDC / swap",                       "100");
  const chains     = await ask("İzin verilen chain ID'leri",            "eip155:8453,eip155:1,eip155:137,eip155:42161,eip155:10");
  const expiry     = await ask("Policy expiry (expires_at)",            "2027-01-01T00:00:00Z");
  const contracts  = await ask("Ekstra contract adresleri (boş=sadece DEX'ler)", "");
  const confirmAmt = await ask("Onay eşiği USDC (0=kapalı)",            "25");

  // Register policy + create API key
  let owsApiKey = "";
  if (walletId) {
    try {
      const contractsFile = path.join(process.cwd(), "data", "contracts.json");

      // Trusted contracts (hardcoded DEXes)
      const TRUSTED = [
        "0x2626664c2603336E57B271c5C0b26F421741e481",
        "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
        "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
        "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      ];

      const policyJson = JSON.stringify({
        id: "lexon-policy",
        name: "Lexon Spend Guard",
        version: 1,
        action: "deny",
        created_at: new Date().toISOString(),
        rules: [
          { type: "allowed_chains", chain_ids: chains.split(",").map((s: string) => s.trim()) },
          { type: "expires_at", timestamp: expiry },
        ],
        executable: executablePath,
        config: {
          max_usdc_per_tx:    parseFloat(maxSend),
          max_eth_per_tx_wei: String(Math.floor(parseFloat(maxEthTx) * 1e18)),
          max_daily_eth_wei:  String(Math.floor(0.1 * 1e18)),
          trusted_contracts:  TRUSTED,
          contracts_file:     contractsFile,
        },
      });

      // Delete existing policy + re-register
      try { deletePolicy("lexon-policy"); } catch {}
      createPolicy(policyJson);
      ok("OWS policy kaydedildi (lexon-policy)");

      // Revoke existing API key named lexon-agent if any
      try {
        const existing = listApiKeys().filter((k: any) => k.name === "lexon-agent");
        for (const k of existing) { try { revokeApiKey(k.id); } catch {} }
      } catch {}

      // Create API key scoped to this wallet + policy
      const keyResult = createApiKey(
        "lexon-agent",
        [walletId],
        ["lexon-policy"],
        walletPassphrase || "",
        expiry
      );
      owsApiKey = keyResult.token;
      ok(`OWS API key oluşturuldu: ${owsApiKey.slice(0, 16)}... (gizli, .env.local'a yazılıyor)`);
    } catch (e: any) {
      warn(`Policy/API key oluşturulamadı: ${e.message}`);
      warn("OWS_API_KEY boş kalacak — policy enforce edilmeyecek (owner mode).");
    }
  }

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

# OpenAI (Whisper voice transcription)
OPENAI_API_KEY=${openaiKey}

# Base Mainnet
BASE_RPC_URL=https://mainnet.base.org

# OWS Wallet
OWS_WALLET_NAME=${walletName}

# OWS API Key — agent mode, policy is enforced before every signing operation.
# Created by setup.ts via createApiKey(). If empty, owner mode is used (no policy).
OWS_API_KEY=${owsApiKey}

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Spend limits
# OWS custom executable enforces: USDC per-tx, ETH per-tx, contract allowlist
# App-layer enforces: USDC daily cap, tx/day count, cooldown, per-address daily
MAX_SEND_USDC=${maxSend}
MAX_DAILY_USDC=${maxDaily}
MAX_SWAP_USD=${maxSwap}
OWS_MAX_ETH_PER_TX=${maxEthTx}
OWS_ALLOWED_CHAINS=${chains}
OWS_POLICY_EXPIRY=${expiry}
${contracts ? `OWS_ALLOWED_CONTRACTS=${contracts}` : "# OWS_ALLOWED_CONTRACTS=0x...,0x...  (comma-separated extras; Uniswap/Aerodrome/Li.Fi already trusted)"}
OWS_CONFIRM_ABOVE_USDC=${confirmAmt}
OWS_MAX_TX_PER_DAY=20
OWS_COOLDOWN_SECONDS=30
OWS_MAX_PER_ADDRESS_DAILY=50

# MoonPay (on-ramp)
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
