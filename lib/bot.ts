import { Bot, Context, webhookCallback } from "grammy";
import { config } from "./config";
import { generateChatReply, parseIntent, type Action } from "./intent";
import { transcribeVoice } from "./voice";
import { sendETH, sendUSDC } from "./actions/send";
import { checkBalance } from "./actions/balance";
import { getWalletAddress } from "./wallet";
import { addToAllowlist, removeFromAllowlist, getAllowlist } from "./allowlist";
import { approveContract, unapproveContract, getAllContracts, getUserContracts, TRUSTED_CONTRACTS } from "./contracts";
import { swapETHtoUSDC, swapUSDCtoETH } from "./actions/swap";
import { getETHPrice } from "./skills/price";
import { getPortfolio, getPositions, getTransactionHistory, getChainBalance } from "./skills/zerion";
import { bridge } from "./skills/lifi";
import { searchToken } from "./skills/moonpay";
import { getWalletPatterns, scoreWallet } from "./skills/allium";
import { extractTxHash, formatPolicyTraceSummary, logPolicyTrace } from "./policy-trace";
import { buyMarketResearch } from "./x402/research-client";
import {
  consumePendingConfirmationAction,
  enforceTransactionGuards,
  getGuardUsageSummary,
  recordSuccessfulTransaction,
  requireHighValueConfirmation,
} from "./guards";
import {
  logInteraction,
  getUserContext,
  getSpendingSummary,
  resolveNameToAddress,
  isKnownAddress,
  queryMemory,
} from "./memory";

function isSuccessfulResponse(response: string): boolean {
  return response.startsWith("✅");
}

function describeRequestedAction(
  kind: "send" | "swap" | "bridge",
  details: Record<string, string | number | undefined>
): string {
  if (kind === "send") {
    return `send ${details.amount ?? "?"} ${details.asset ?? "USDC"} to ${details.to ?? "recipient"}`;
  }
  if (kind === "swap") {
    return `swap ${details.amount ?? "?"} ${details.fromToken ?? "asset"} to ${details.toToken ?? "asset"}`;
  }
  return `bridge ${details.amount ?? "?"} ${details.fromToken ?? "asset"} from ${details.fromChain ?? "base"} to ${details.toChain ?? "destination"}`;
}

function describeExecutedAction(
  kind: "send" | "swap" | "bridge",
  details: Record<string, string | number | undefined>
): string {
  return describeRequestedAction(kind, details);
}

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
  return config.telegramOwnerIds.length > 0;
}

function isOwner(ctx: Context): boolean {
  const userId = ctx.from?.id;
  return Boolean(userId && config.telegramOwnerIds.includes(String(userId)));
}

async function requireOwner(ctx: Context, capability: string): Promise<boolean> {
  if (!hasOwnerConfig()) {
    await ctx.reply(
      `🔒 \`${capability}\` için owner yetkisi gerekli.\n\nÖnce \`TELEGRAM_OWNER_IDS\` ayarlamalısın.`,
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

const HELP_TEXT = `
🔷 *Lexon* — DeFi on Base via natural language

*Yapabileceklerin:*

💸 *ETH / USDC Gönder*
"Send 1.5 USDC to 0x1234...abcd"
"Send 0.0015 ETH to 0x1234...abcd"
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
    await handleCommand(ctx);
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
      await handleCommand(ctx, transcript);
    } catch {
      await ctx.reply("❌ Could not process voice message.");
    }
  });
}

async function handleCommand(ctx: Context, override?: string) {
  const text = override ?? (ctx.message as any)?.text ?? "";
  const userId = ctx.from?.id;

  // Kullanıcı bağlamını Honcho'dan al (intent parsing'e ekle)
  const userContext = userId ? await getUserContext(userId) : "";
  const action = consumePendingConfirmationAction(userId, text) ?? await parseIntent(text, userContext);

  const ownerOnlyActions = new Set<Action["type"]>([
    "send",
    "balance",
    "spending_summary",
    "portfolio",
    "wallet_score",
    "wallet_patterns",
    "positions",
    "tx_history",
    "research_query",
    "bridge",
    "swap_eth_usdc",
    "swap_usdc_eth",
  ]);

  if (ownerOnlyActions.has(action.type) && !(await requireOwner(ctx, action.type))) {
    return;
  }

  let response = "";

  switch (action.type) {
    case "send": {
      let to = action.to;
      const asset = action.asset ?? "USDC";
      const amount = Number.parseFloat(action.amount);
      const requestedAction = describeRequestedAction("send", {
        amount: action.amount,
        asset,
        to: action.to || action.name,
      });

      // İsimle gönderim: "Ali'ye gönder" → adres çözümle
      if ((!to || !to.startsWith("0x")) && action.name && userId) {
        const resolved = await resolveNameToAddress(userId, action.name);
        if (!resolved) {
          response = `🤔 "${action.name}" adına kayıtlı adres bulunamadı.\n\nŞunu dene: \`/allow 0x... ${action.name}\``;
          logPolicyTrace({
            decision: "deny",
            requestedType: "send",
            requestedAction,
            guardCode: "name_resolution_failed",
            matchedRules: ["recipient_resolution"],
            denyReason: `No address found for ${action.name}`,
          });
          await ctx.reply(response, { parse_mode: "Markdown" });
          break;
        }
        to = resolved;
      }

      // İlk kez gönderilen adres uyarısı
      if (userId && to.startsWith("0x")) {
        const known = await isKnownAddress(userId, to);
        if (!known) {
          logPolicyTrace({
            decision: "deny",
            requestedType: "send",
            requestedAction,
            guardCode: "recipient_not_trusted",
            matchedRules: ["recipient_allowlist"],
            denyReason: "Recipient is not yet trusted",
            details: { recipient: to },
          });
          await ctx.reply(
            `⚠️ *Yeni adres!*\n\n\`${to}\`\n\nBu adrese daha önce göndermemişsin. Devam etmek için aynı komutu tekrar gönder.`,
            { parse_mode: "Markdown" }
          );
          break;
        }
      }

      const confirmation =
        asset === "USDC"
          ? requireHighValueConfirmation(userId, { ...action, to, asset }, amount)
          : { ok: true as const, code: "allow" as const, matchedRules: ["confirm_above_usdc"] };
      if (!confirmation.ok) {
        response = confirmation.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "send",
          requestedAction,
          guardCode: confirmation.code,
          matchedRules: confirmation.matchedRules,
          denyReason: confirmation.message,
          details: confirmation.details,
        });
        await ctx.reply(response, { parse_mode: "Markdown" });
        break;
      }

      const guard = enforceTransactionGuards({
        kind: "send",
        amountUSDC: asset === "USDC" && Number.isFinite(amount) ? amount : undefined,
        recipient: to,
      });
      if (!guard.ok) {
        response = guard.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "send",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          denyReason: guard.message,
          details: guard.details,
        });
        await ctx.reply(response, { parse_mode: "Markdown" });
        break;
      }

      const msg = await ctx.reply("⏳ İşlem hazırlanıyor...");
      response = asset === "ETH" ? await sendETH(to, action.amount) : await sendUSDC(to, action.amount);
      if (isSuccessfulResponse(response)) {
        recordSuccessfulTransaction({
          kind: "send",
          amountUSDC: asset === "USDC" && Number.isFinite(amount) ? amount : undefined,
          recipient: to,
        });
        logPolicyTrace({
          decision: "allow",
          requestedType: "send",
          requestedAction,
          guardCode: guard.code,
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          executedAction: describeExecutedAction("send", { amount: action.amount, asset, to }),
          executionTxHash: extractTxHash(response) ?? undefined,
          details: { recipient: to, usage: getGuardUsageSummary() },
        });
      } else {
        logPolicyTrace({
          decision: "deny",
          requestedType: "send",
          requestedAction,
          guardCode: "execution_failed",
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          denyReason: response,
          details: { recipient: to },
        });
      }
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response, {
        parse_mode: "Markdown",
      });
      break;
    }
    case "balance": {
      const address = action.address || getWalletAddress();
      response = await checkBalance(address);
      await ctx.reply(response, { parse_mode: "Markdown" });
      break;
    }
    case "chain_balance": {
      const address = await resolveTargetAddress(ctx, action.address);
      response = await getChainBalance(address, action.chain);
      await ctx.reply(response, { parse_mode: "Markdown" });
      break;
    }
    case "price": {
      const msg = await ctx.reply("⏳ Fiyat alınıyor...");
      response = await getETHPrice();
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response, {
        parse_mode: "Markdown",
      });
      break;
    }
    case "portfolio": {
      const address = await resolveTargetAddress(ctx, action.address);
      response = await getPortfolio(address);
      await ctx.reply(response, { parse_mode: "Markdown" });
      break;
    }
    case "positions": {
      const address = await resolveTargetAddress(ctx, action.address);
      response = await getPositions(address);
      await ctx.reply(response, { parse_mode: "Markdown" });
      break;
    }
    case "tx_history": {
      const address = await resolveTargetAddress(ctx, action.address);
      response = await getTransactionHistory(address);
      await ctx.reply(response, { parse_mode: "Markdown" });
      break;
    }
    case "wallet_score": {
      const address = await resolveTargetAddress(ctx, action.address);
      response = await scoreWallet(address);
      await ctx.reply(response, { parse_mode: "Markdown" });
      break;
    }
    case "wallet_patterns": {
      const address = await resolveTargetAddress(ctx, action.address);
      response = await getWalletPatterns(address);
      await ctx.reply(response, { parse_mode: "Markdown" });
      break;
    }
    case "research_query": {
      const msg = await ctx.reply("⏳ Paid research capability çağrılıyor...");
      try {
        response = await buyMarketResearch(action.query).catch((err: any) =>
          `❌ Research capability çağrısı başarısız: ${err?.message?.slice(0, 120) || "Unknown error"}`
        );
        await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response);
      } catch (err: any) {
        response = `❌ Research capability çağrısı başarısız: ${err?.message?.slice(0, 160) || "Unknown error"}`;
        await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response);
      }
      break;
    }
    case "bridge": {
      const amount = Number.parseFloat(action.amount);
      const amountUSDC = action.fromToken.toUpperCase() === "USDC" && Number.isFinite(amount) ? amount : undefined;
      const requestedAction = describeRequestedAction("bridge", {
        amount: action.amount,
        fromToken: action.fromToken,
        fromChain: action.fromChain,
        toChain: action.toChain,
      });
      const confirmation = requireHighValueConfirmation(userId, action, amountUSDC);
      if (!confirmation.ok) {
        response = confirmation.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "bridge",
          requestedAction,
          guardCode: confirmation.code,
          matchedRules: confirmation.matchedRules,
          denyReason: confirmation.message,
          details: confirmation.details,
        });
        await ctx.reply(response, { parse_mode: "Markdown" });
        break;
      }
      const guard = enforceTransactionGuards({
        kind: "bridge",
        amountUSDC,
      });
      if (!guard.ok) {
        response = guard.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "bridge",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          denyReason: guard.message,
          details: guard.details,
        });
        await ctx.reply(response, { parse_mode: "Markdown" });
        break;
      }
      const msg = await ctx.reply(`⏳ Li.Fi route bulunuyor (${action.fromChain} → ${action.toChain})...`);
      response = await bridge(action.fromChain, action.toChain, action.fromToken, action.amount, action.toToken);
      if (isSuccessfulResponse(response)) {
        recordSuccessfulTransaction({
          kind: "bridge",
          amountUSDC,
        });
        logPolicyTrace({
          decision: "allow",
          requestedType: "bridge",
          requestedAction,
          guardCode: guard.code,
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          executedAction: describeExecutedAction("bridge", {
            amount: action.amount,
            fromToken: action.fromToken,
            fromChain: action.fromChain,
            toChain: action.toChain,
          }),
          executionTxHash: extractTxHash(response) ?? undefined,
        });
      } else {
        logPolicyTrace({
          decision: "deny",
          requestedType: "bridge",
          requestedAction,
          guardCode: "execution_failed",
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          denyReason: response,
        });
      }
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response, { parse_mode: "Markdown" });
      break;
    }
    case "token_search": {
      await ctx.replyWithChatAction("typing");
      response = await searchToken(action.query, action.chain);
      await ctx.reply(response, { parse_mode: "Markdown" });
      break;
    }
    case "spending_summary": {
      if (!userId) {
        await ctx.reply("❌ Kullanıcı bilgisi alınamadı.");
        break;
      }
      await ctx.replyWithChatAction("typing");
      response = await getSpendingSummary(userId);
      await ctx.reply(`📊 *Harcama Geçmişin*\n\n${response}`, { parse_mode: "Markdown" });
      break;
    }
    case "help": {
      response = HELP_TEXT;
      await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
      break;
    }
    case "swap_eth_usdc": {
      const requestedAction = describeRequestedAction("swap", {
        amount: action.amount,
        fromToken: "ETH",
        toToken: "USDC",
      });
      const guard = enforceTransactionGuards({ kind: "swap" });
      if (!guard.ok) {
        response = guard.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          denyReason: guard.message,
          details: guard.details,
        });
        await ctx.reply(response, { parse_mode: "Markdown" });
        break;
      }
      const msg = await ctx.reply("⏳ ETH → USDC swap...");
      response = await swapETHtoUSDC(action.amount, action.dex);
      if (isSuccessfulResponse(response)) {
        recordSuccessfulTransaction({ kind: "swap" });
        logPolicyTrace({
          decision: "allow",
          requestedType: "swap",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          executedAction: describeExecutedAction("swap", { amount: action.amount, fromToken: "ETH", toToken: "USDC" }),
          executionTxHash: extractTxHash(response) ?? undefined,
        });
      } else {
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: "execution_failed",
          matchedRules: guard.matchedRules,
          denyReason: response,
        });
      }
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response, {
        parse_mode: "Markdown",
      });
      break;
    }
    case "swap_usdc_eth": {
      const amount = Number.parseFloat(action.amount);
      const requestedAction = describeRequestedAction("swap", {
        amount: action.amount,
        fromToken: "USDC",
        toToken: "ETH",
      });
      const confirmation = requireHighValueConfirmation(
        userId,
        action,
        Number.isFinite(amount) ? amount : undefined
      );
      if (!confirmation.ok) {
        response = confirmation.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: confirmation.code,
          matchedRules: confirmation.matchedRules,
          denyReason: confirmation.message,
          details: confirmation.details,
        });
        await ctx.reply(response, { parse_mode: "Markdown" });
        break;
      }
      const guard = enforceTransactionGuards({
        kind: "swap",
        amountUSDC: Number.isFinite(amount) ? amount : undefined,
      });
      if (!guard.ok) {
        response = guard.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          denyReason: guard.message,
          details: guard.details,
        });
        await ctx.reply(response, { parse_mode: "Markdown" });
        break;
      }
      const msg = await ctx.reply("⏳ USDC → ETH swap...");
      response = await swapUSDCtoETH(action.amount, action.dex);
      if (isSuccessfulResponse(response)) {
        recordSuccessfulTransaction({
          kind: "swap",
          amountUSDC: Number.isFinite(amount) ? amount : undefined,
        });
        logPolicyTrace({
          decision: "allow",
          requestedType: "swap",
          requestedAction,
          guardCode: guard.code,
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          executedAction: describeExecutedAction("swap", { amount: action.amount, fromToken: "USDC", toToken: "ETH" }),
          executionTxHash: extractTxHash(response) ?? undefined,
        });
      } else {
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: "execution_failed",
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          denyReason: response,
        });
      }
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response, {
        parse_mode: "Markdown",
      });
      break;
    }
    case "unknown": {
      response = await generateChatReply(text, userContext);
      await ctx.reply(response, { parse_mode: "Markdown" });
      break;
    }
  }

  // Her etkileşimi Honcho'ya yaz (best-effort)
  if (userId && text && response) {
    await logInteraction(userId, text, response);
  }
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
