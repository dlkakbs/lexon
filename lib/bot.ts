import { Bot, Context, webhookCallback } from "grammy";
import { config } from "./config";
import { transcribeVoice } from "./voice";
import { getWalletAddress } from "./wallet";
import { addToAllowlist, removeFromAllowlist, getAllowlist } from "./allowlist";
import { approveContract, unapproveContract, getUserContracts, TRUSTED_CONTRACTS } from "./contracts";
import { getETHPrice } from "./skills/price";
import { getPortfolio, getPositions, getTransactionHistory, getChainBalance } from "./skills/zerion";
import { getWalletPatterns, scoreWallet } from "./skills/allium";
import { formatPolicyTraceSummary } from "./policy-trace";
import { buyMarketResearch } from "./x402/research-client";
import { handleLexonMessage, type LexonMessageHandle } from "./runtime";
import { getUserContext, queryMemory } from "./memory";

async function resolveTargetAddress(ctx: Context, explicit?: string) {
  if (explicit?.match(/^0x[a-fA-F0-9]{40}$/)) return explicit;
  const userId = ctx.from?.id;
  const remembered = await queryMemory(
    userId ?? 0,
    "What is this user's main wallet address? Return only the 0x address or null."
  ).catch(() => null);
  return remembered?.match(/0x[a-fA-F0-9]{40}/)?.[0] ?? getWalletAddress();
}

function hasOwnerConfig(): boolean {
  return config.ownerIds.length > 0;
}

function isOwner(ctx: Context): boolean {
  const userId = ctx.from?.id;
  return Boolean(userId && config.ownerIds.includes(String(userId)));
}

async function requireOwner(ctx: Context, capability: string): Promise<boolean> {
  if (!hasOwnerConfig()) {
    await ctx.reply(
      `🔒 \`${capability}\` için owner yetkisi gerekli.\n\nÖnce \`LEXON_OWNER_IDS\` ayarlamalısın.`,
      { parse_mode: "Markdown" }
    );
    return false;
  }

  if (!isOwner(ctx)) {
    await ctx.reply(
      `⛔ Bu işlem sadece bot owner'ı için açık: \`${capability}\``,
      { parse_mode: "Markdown" }
    );
    return false;
  }

  return true;
}

function createTelegramSession(ctx: Context) {
  return {
    transport: "telegram" as const,
    actorId: ctx.from?.id ? String(ctx.from.id) : undefined,
    conversationId: ctx.chat?.id ? String(ctx.chat.id) : undefined,
    reply: async (text: string, options?: { markdown?: boolean }): Promise<LexonMessageHandle | null> => {
      const raw = await ctx.reply(text, options?.markdown ? { parse_mode: "Markdown" } : undefined);
      return { raw };
    },
    edit: async (message: LexonMessageHandle, text: string, options?: { markdown?: boolean }) => {
      const sent = message.raw as { message_id: number } | null;
      if (!sent?.message_id || !ctx.chat?.id) {
        await ctx.reply(text, options?.markdown ? { parse_mode: "Markdown" } : undefined);
        return;
      }
      await ctx.api.editMessageText(
        ctx.chat.id,
        sent.message_id,
        text,
        options?.markdown ? { parse_mode: "Markdown" } : undefined
      );
    },
    typing: async () => {
      await ctx.replyWithChatAction("typing");
    },
  };
}

const HELP_TEXT = `
🔷 *Lexon* — DeFi on Base via natural language

*Yapabileceklerin:*

💸 *USDC Gönder*
"Send 1.5 USDC to 0x1234...abcd"
"Ali'ye 2 USDC gönder" _(kayıtlı isim)_

💰 *Bakiye Sorgula*
"What's my balance?" / "Bakiyem ne kadar?"
"Check balance of 0x1234..."

📊 *ETH Fiyatı*
"ETH fiyatı ne?" / "How much is ETH?"

🧾 *Harcama Geçmişi*
"Bu hafta ne harcadım?" / "My spending history"

🔄 *Swap (Base)*
"Swap 0.001 ETH to USDC"
"Swap 3 USDC to ETH on Aerodrome"

🌉 *Cross-chain Bridge (Li.Fi + OWS)*
"Bridge 5 USDC to Polygon"
"Arbitrum'a 10 USDC gönder"

🔍 *Token Ara*
"PEPE token nedir?" / "Search USDC on Solana"

🎙 *Sesli Komut*
Sesli mesaj gönder — Whisper otomatik çevirir.

⚙️ *Güvenlik Limitleri (OWS Policy)*
• Max $${config.maxSendUSDC} USDC / işlem
• Max $${config.maxDailyUSDC} USDC / gün
• Max $${config.maxSwapUSD} / swap (ETH veya USDC)
• Sadece izin listesindeki adresler
• Yeni adreste otomatik uyarı

📋 *Komutlar*
📋 *Komutlar*
/wallet — Cüzdan adresini göster
/portfolio — Tüm chain'lerde portföy (Zerion)
/chainbalance <chain> — belirli ağdaki bakiye
/scorewallet — Base wallet risk/activity score
/walletpatterns — Base wallet activity summary
/price — Anlık ETH fiyatı
/bridge — Cross-chain bridge bilgisi
/policy — Aktif OWS policy kuralları
/audit — Son policy kararları ve günlük özet
/catalog — x402 capability catalog linki
/research <soru> — x402 ile ücretli research capability satın al

👥 *Gönderim Listesi*
/add <adres> [isim] — Gönderim listesine ekle
/remove <adres> — Gönderim listesinden çıkar
/list — Gönderim listesini göster

🛡 *OWS Contract Whitelist*
/approve <adres> [isim] — Contract'ı policy'ye ekle
/unapprove <adres> — Contract'ı kaldır
/contracts — Onaylı contract listesi

⚙️ *Diğer*
/fund — MoonPay ile USDC al
/memory — Lexon'ın seni ne kadar tanıdığını gör
/help — Bu menü
`.trim();

const KNOWN_COMMANDS = new Set([
  "start",
  "help",
  "wallet",
  "catalog",
  "research",
  "audit",
  "add",
  "approve",
  "unapprove",
  "contracts",
  "allow",
  "remove",
  "fund",
  "list",
  "portfolio",
  "chainbalance",
  "scorewallet",
  "walletpatterns",
  "price",
  "bridge",
  "policy",
  "memory",
]);

export function registerHandlers(bot: Bot, token: string) {
  bot.catch((err) => {
    console.error("Telegram bot handler error:", err.error);
  });

  bot.command("start", async (ctx) => {
    await ctx.reply(
      `👋 Hey! I'm *Lexon* — your AI assistant for Base transactions.\n\n` +
      `Type or speak in any language. I'll handle the rest.\n\n` +
      HELP_TEXT,
      { parse_mode: "Markdown" }
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
  });

  bot.command("wallet", async (ctx) => {
    if (!(await requireOwner(ctx, "/wallet"))) return;
    try {
      const address = getWalletAddress();
      await ctx.reply(
        `🔷 *Lexon Wallet*\n\n` +
        `\`${address}\`\n\n` +
        `[View on Basescan](https://basescan.org/address/${address})`,
        { parse_mode: "Markdown" }
      );
    } catch {
      await ctx.reply("❌ Could not retrieve wallet address.");
    }
  });

  bot.command("catalog", async (ctx) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const catalogPath = "/api/x402/catalog";
    const catalogUrl = appUrl ? `${appUrl}${catalogPath}` : catalogPath;
    const evaluateBridgePath =
      "/api/x402/paid/evaluate-bridge?fromChain=base&toChain=arbitrum&fromToken=USDC&amount=10";
    const evaluateBridgeUrl = appUrl ? `${appUrl}${evaluateBridgePath}` : evaluateBridgePath;

    await ctx.reply(
      `💸 *Lexon x402 Catalog*\n\n` +
      `Lexon exposes callable capabilities for other agents over x402.\n\n` +
      `*Live capability*\n` +
      `• \`evaluate_bridge\`\n` +
      `• returns allow/deny, matched rules, route, and fee\n` +
      `• paid via x402\n\n` +
      `🔗 Evaluate bridge: ${evaluateBridgeUrl}\n` +
      `🔗 Catalog: ${catalogUrl}\n\n` +
      `Current mode:\n` +
      `• self-hosted wallet operator\n` +
      `• monetizable capabilities over x402`,
      { parse_mode: "Markdown" }
    );
  });

  bot.command("research", async (ctx) => {
    if (!(await requireOwner(ctx, "/research"))) return;
    const query = (ctx.message?.text ?? "").split(" ").slice(1).join(" ").trim();
    if (!query) {
      await ctx.reply("Kullanım: `/research Base ve Arbitrum stablecoin activity son 7 gün`", {
        parse_mode: "Markdown",
      });
      return;
    }

    const msg = await ctx.reply("⏳ Ücretli research capability çağrılıyor...");
    try {
      const result = await buyMarketResearch(query).catch((err: any) =>
        `❌ Research capability çağrısı başarısız: ${err?.message?.slice(0, 120) || "Unknown error"}`
      );
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, result);
    } catch (err: any) {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        `❌ Research capability çağrısı başarısız: ${err?.message?.slice(0, 160) || "Unknown error"}`
      );
    }
  });

  bot.command("audit", async (ctx) => {
    if (!(await requireOwner(ctx, "/audit"))) return;
    await ctx.reply(formatPolicyTraceSummary(), { parse_mode: "Markdown" });
  });

  // /add 0x... İsim — gönderim allowlist'i
  bot.command("add", async (ctx) => {
    if (!(await requireOwner(ctx, "/add"))) return;
    const parts = (ctx.message?.text ?? "").split(" ").slice(1);
    const address = parts[0];
    const label = parts.slice(1).join(" ") || "Kişisel";
    if (!address?.startsWith("0x")) {
      await ctx.reply("Kullanım: `/add 0x... İsim`", { parse_mode: "Markdown" });
      return;
    }
    addToAllowlist(address, label);
    await ctx.reply(`✅ *Gönderim listesine eklendi*\n\`${address}\` — ${label}`, { parse_mode: "Markdown" });
  });

  // /approve 0x... İsim — OWS policy contract whitelist
  bot.command("approve", async (ctx) => {
    if (!(await requireOwner(ctx, "/approve"))) return;
    const parts = (ctx.message?.text ?? "").split(" ").slice(1);
    const address = parts[0];
    const label = parts.slice(1).join(" ") || "Contract";
    if (!address?.startsWith("0x")) {
      await ctx.reply("Kullanım: `/approve 0x... İsim`\nÖrnek: `/approve 0x1234... Yeni DEX`", { parse_mode: "Markdown" });
      return;
    }
    if (TRUSTED_CONTRACTS[address]) {
      await ctx.reply(`ℹ️ \`${address}\` zaten varsayılan güvenli listede: ${TRUSTED_CONTRACTS[address]}`, { parse_mode: "Markdown" });
      return;
    }
    approveContract(address, label);
    await ctx.reply(`✅ *Contract onaylandı*\n\`${address}\` — ${label}\n\n_OWS policy'ye eklendi. Yeni işlemlerden geçerli._`, { parse_mode: "Markdown" });
  });

  // /unapprove 0x... — OWS policy contract listesinden çıkar
  bot.command("unapprove", async (ctx) => {
    if (!(await requireOwner(ctx, "/unapprove"))) return;
    const address = (ctx.message?.text ?? "").split(" ")[1];
    if (!address?.startsWith("0x")) {
      await ctx.reply("Kullanım: `/unapprove 0x...`", { parse_mode: "Markdown" });
      return;
    }
    if (TRUSTED_CONTRACTS[address]) {
      await ctx.reply(`⚠️ \`${address}\` varsayılan güvenli listede (${TRUSTED_CONTRACTS[address]}) — çıkarılamaz.`, { parse_mode: "Markdown" });
      return;
    }
    unapproveContract(address);
    await ctx.reply(`🗑 Contract kaldırıldı: \`${address}\``, { parse_mode: "Markdown" });
  });

  // /contracts — onaylı contract listesi
  bot.command("contracts", async (ctx) => {
    if (!(await requireOwner(ctx, "/contracts"))) return;
    const trusted = Object.entries(TRUSTED_CONTRACTS);
    const user = Object.entries(getUserContracts());

    const trustedLines = trusted.map(([addr, label]) =>
      `• \`${addr.slice(0, 6)}...${addr.slice(-4)}\` — ${label} _(varsayılan)_`
    );
    const userLines = user.map(([addr, label]) =>
      `• \`${addr.slice(0, 6)}...${addr.slice(-4)}\` — ${label}`
    );

    const text =
      `🛡 *OWS Onaylı Contract'lar*\n\n` +
      `*Varsayılan (değiştirilemez):*\n${trustedLines.join("\n")}` +
      (userLines.length > 0 ? `\n\n*Kullanıcı eklemeleri:*\n${userLines.join("\n")}` : "\n\n_Henüz kullanıcı eklemesi yok._") +
      `\n\n/approve 0x... İsim — ekle\n/unapprove 0x... — kaldır`;

    await ctx.reply(text, { parse_mode: "Markdown" });
  });

  // /allow 0x123... MyFriend
  bot.command("allow", async (ctx) => {
    if (!(await requireOwner(ctx, "/allow"))) return;
    const parts = (ctx.message?.text ?? "").split(" ").slice(1);
    const address = parts[0];
    const label = parts.slice(1).join(" ") || "Personal";

    if (!address || !address.startsWith("0x")) {
      await ctx.reply("Usage: `/allow 0x... Label`", { parse_mode: "Markdown" });
      return;
    }

    addToAllowlist(address, label);
    await ctx.reply(
      `✅ *Address added to allowlist*\n\n\`${address}\`\nLabel: ${label}`,
      { parse_mode: "Markdown" }
    );
  });

  // /remove 0x123...
  bot.command("remove", async (ctx) => {
    if (!(await requireOwner(ctx, "/remove"))) return;
    const address = (ctx.message?.text ?? "").split(" ")[1];
    if (!address || !address.startsWith("0x")) {
      await ctx.reply("Usage: `/remove 0x...`", { parse_mode: "Markdown" });
      return;
    }

    removeFromAllowlist(address);
    await ctx.reply(
      `🗑 *Address removed*\n\n\`${address}\``,
      { parse_mode: "Markdown" }
    );
  });

  // /fund
  bot.command("fund", async (ctx) => {
    if (!(await requireOwner(ctx, "/fund"))) return;
    const address = getWalletAddress();
    const moonpayUrl =
      `https://buy.moonpay.com?` +
      `apiKey=pk_live_test&` +
      `currencyCode=usdc_base&` +
      `walletAddress=${address}&` +
      `colorCode=%23BB734B`;

    await ctx.reply(
      `💳 *Fund your Lexon wallet*\n\n` +
      `Wallet: \`${address}\`\n\n` +
      `👉 [Buy USDC on Base via MoonPay](${moonpayUrl})\n\n` +
      `_Or run_ \`ows fund deposit --wallet lexon-wallet\` _in terminal._`,
      { parse_mode: "Markdown" }
    );
  });

  // /list
  bot.command("list", async (ctx) => {
    if (!(await requireOwner(ctx, "/list"))) return;
    const all = getAllowlist();
    const entries = Object.entries(all);
    if (entries.length === 0) {
      await ctx.reply("No addresses in allowlist.");
      return;
    }
    const lines = entries.map(([addr, label]) =>
      `• \`${addr.slice(0, 6)}...${addr.slice(-4)}\` — ${label}`
    );
    await ctx.reply(
      `📋 *Allowed Addresses*\n\n${lines.join("\n")}`,
      { parse_mode: "Markdown" }
    );
  });

  // /portfolio — Zerion multi-chain portföy
  bot.command("portfolio", async (ctx) => {
    if (!(await requireOwner(ctx, "/portfolio"))) return;
    await ctx.replyWithChatAction("typing");
    const explicit = (ctx.message?.text ?? "").match(/0x[a-fA-F0-9]{40}/)?.[0];
    const address = await resolveTargetAddress(ctx, explicit);
    const result = await getPortfolio(address);
    await ctx.reply(result, { parse_mode: "Markdown" });
  });

  bot.command("chainbalance", async (ctx) => {
    if (!(await requireOwner(ctx, "/chainbalance"))) return;
    await ctx.replyWithChatAction("typing");
    const text = ctx.message?.text ?? "";
    const chain = text.split(" ").slice(1).join(" ").trim().toLowerCase();
    if (!chain) {
      await ctx.reply("Kullanım: `/chainbalance arbitrum`", { parse_mode: "Markdown" });
      return;
    }
    const explicit = text.match(/0x[a-fA-F0-9]{40}/)?.[0];
    const address = await resolveTargetAddress(ctx, explicit);
    const result = await getChainBalance(address, chain);
    await ctx.reply(result, { parse_mode: "Markdown" });
  });

  bot.command("scorewallet", async (ctx) => {
    if (!(await requireOwner(ctx, "/scorewallet"))) return;
    await ctx.replyWithChatAction("typing");
    const explicit = (ctx.message?.text ?? "").match(/0x[a-fA-F0-9]{40}/)?.[0];
    const address = await resolveTargetAddress(ctx, explicit);
    const result = await scoreWallet(address);
    await ctx.reply(result, { parse_mode: "Markdown" });
  });

  bot.command("walletpatterns", async (ctx) => {
    if (!(await requireOwner(ctx, "/walletpatterns"))) return;
    await ctx.replyWithChatAction("typing");
    const explicit = (ctx.message?.text ?? "").match(/0x[a-fA-F0-9]{40}/)?.[0];
    const address = await resolveTargetAddress(ctx, explicit);
    const result = await getWalletPatterns(address);
    await ctx.reply(result, { parse_mode: "Markdown" });
  });

  // /price — anlık ETH fiyatı
  bot.command("price", async (ctx) => {
    await ctx.replyWithChatAction("typing");
    const result = await getETHPrice();
    await ctx.reply(result, { parse_mode: "Markdown" });
  });

  // /bridge — bridge yardımı
  bot.command("bridge", async (ctx) => {
    await ctx.reply(
      `🌉 *Cross-chain Bridge*\n\n` +
      `Base'den diğer chain'lere USDC bridge edebilirsin:\n\n` +
      `*Örnekler:*\n` +
      `"Bridge 10 USDC to Polygon"\n` +
      `"Arbitrum'a 0.01 ETH bridge et"\n` +
      `"Ethereum'a 0.005 ETH gönder, USDC olarak al"\n\n` +
      `*Desteklenen tokenlar:* ETH · USDC\n` +
      `*Desteklenen hedefler:*\n` +
      `• polygon · arbitrum · ethereum · optimism\n` +
      `• bnb · avalanche · zksync · linea\n` +
      `• scroll · blast · mantle · unichain\n\n` +
      `_Li.Fi routing · OWS imzalı · ~1-5 dk_`,
      { parse_mode: "Markdown" }
    );
  });

  // /policy — aktif OWS policy kurallarını göster
  bot.command("policy", async (ctx) => {
    if (!(await requireOwner(ctx, "/policy"))) return;
    await ctx.reply(
      `🛡 *OWS Policy — Aktif Kurallar*\n\n` +
      `💸 Max gönderim: $${config.maxSendUSDC} USDC/işlem\n` +
      `📅 Max günlük: $${config.maxDailyUSDC} USDC\n` +
      `🔄 Max swap: $${config.maxSwapUSD}\n` +
      `🔢 Max işlem/gün: ${config.maxTxPerDay}\n` +
      `⏱ Cooldown: ${config.cooldownSeconds}sn\n` +
      `📍 Adres başına: $${config.maxPerAddressDaily}/gün\n` +
      `⚠️ Onay eşiği: $${config.confirmAboveUSDC}\n` +
      `⛓ Chain: ${config.allowedChainIds.join(", ")}\n` +
      `📆 Expiry: ${config.policyExpiry.slice(0, 10)}`,
      { parse_mode: "Markdown" }
    );
  });

  // /memory — kullanıcının Honcho'daki profilini göster
  bot.command("memory", async (ctx) => {
    if (!(await requireOwner(ctx, "/memory"))) return;
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.replyWithChatAction("typing");
    const summary = await getUserContext(userId);
    if (!summary) {
      await ctx.reply("🧠 Henüz yeterli etkileşim yok. Biraz konuş, seni tanıyayım!");
      return;
    }
    await ctx.reply(`🧠 *Seni ne biliyorum:*\n\n${summary}`, { parse_mode: "Markdown" });
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith("/")) {
      const command = text.slice(1).split(/\s+/)[0]?.split("@")[0]?.toLowerCase();
      if (command && !KNOWN_COMMANDS.has(command)) {
        await ctx.reply(
          `❌ Bilinmeyen komut: \`/${command}\`\n\n` +
          `Doğru komutları görmek için \`/help\` yaz.`,
          { parse_mode: "Markdown" }
        );
      }
      return;
    }
    await ctx.replyWithChatAction("typing");
    await handleLexonMessage(createTelegramSession(ctx), text);
  });

  bot.on("message:voice", async (ctx) => {
    await ctx.replyWithChatAction("typing");
    try {
      const file = await ctx.getFile();
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const transcript = await transcribeVoice(buffer);
      const heard = transcript.trim();
      if (!heard) {
        await ctx.reply("❌ Sesli mesaj anlaşılamadı. Lütfen tekrar dene.");
        return;
      }
      await ctx.reply(`🎙 *I heard:*\n${heard}`, { parse_mode: "Markdown" });
      await handleLexonMessage(createTelegramSession(ctx), transcript);
    } catch {
      await ctx.reply("❌ Could not process voice message.");
    }
  });
}

let _bot: Bot | null = null;

function getBot(): Bot {
  if (!_bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
    _bot = new Bot(token);
    registerHandlers(_bot, token);
  }
  return _bot;
}

export function handleWebhook(req: Request): Promise<Response> {
  return webhookCallback(getBot(), "std/http")(req);
}
