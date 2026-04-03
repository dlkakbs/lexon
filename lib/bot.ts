import { Bot, Context, webhookCallback } from "grammy";
import { exec } from "child_process";
import { config } from "./config";
import { parseIntent } from "./intent";
import { transcribeVoice } from "./voice";
import { sendUSDC } from "./actions/send";
import { checkBalance } from "./actions/balance";
import { getWalletAddress } from "./wallet";
import { addToAllowlist, removeFromAllowlist, getAllowlist } from "./allowlist";
import { approveContract, unapproveContract, getAllContracts, getUserContracts, TRUSTED_CONTRACTS } from "./contracts";
import { swapETHtoUSDC, swapUSDCtoETH } from "./actions/swap";
import { getETHPrice } from "./skills/price";
import { getPortfolio, getPositions, getTransactionHistory, getPnL } from "./skills/zerion";
import { bridge } from "./skills/lifi";
import { searchToken } from "./skills/moonpay";
import {
  logInteraction,
  getUserContext,
  getSpendingSummary,
  resolveNameToAddress,
  isKnownAddress,
  queryMemory,
} from "./memory";

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
/pnl — 24s kar/zarar
/price — Anlık ETH fiyatı
/bridge — Cross-chain bridge bilgisi
/policy — Aktif OWS policy kuralları

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
/update — Son sürüme güncelle
/help — Bu menü
`.trim();

function registerHandlers(bot: Bot, token: string) {
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

  // /add 0x... İsim — gönderim allowlist'i
  bot.command("add", async (ctx) => {
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
    const userId = ctx.from?.id;
    await ctx.replyWithChatAction("typing");
    const userCtx = userId ? await getUserContext(userId) : "";
    const addr = await queryMemory(userId ?? 0, "What is this user's main wallet address? Return only the 0x address or null.").catch(() => null);
    const address = addr?.match(/0x[a-fA-F0-9]{40}/)?.[0] ?? getWalletAddress();
    const result = await getPortfolio(address);
    await ctx.reply(result, { parse_mode: "Markdown" });
  });

  // /pnl — 24s kar/zarar
  bot.command("pnl", async (ctx) => {
    await ctx.replyWithChatAction("typing");
    const userId = ctx.from?.id;
    const addr = await queryMemory(userId ?? 0, "What is this user's main wallet address? Return only the 0x address or null.").catch(() => null);
    const address = addr?.match(/0x[a-fA-F0-9]{40}/)?.[0] ?? getWalletAddress();
    const result = await getPnL(address);
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

  // /update — son sürüme güncelle
  bot.command("update", async (ctx) => {
    const msg = await ctx.reply("🔄 Güncelleme kontrol ediliyor...");
    exec("git pull && npm install --silent", { cwd: process.cwd() }, async (err, stdout, stderr) => {
      const output = (stdout || stderr || "").trim().slice(0, 600);
      if (err && !stdout.includes("up to date") && !stdout.includes("Already up to date")) {
        await ctx.api.editMessageText(ctx.chat!.id, msg.message_id,
          `❌ Güncelleme başarısız:\n\`\`\`\n${output}\n\`\`\``,
          { parse_mode: "Markdown" }
        );
        return;
      }
      const isUpToDate = stdout.includes("up to date") || stdout.includes("Already up to date");
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id,
        isUpToDate
          ? `✅ Lexon zaten güncel.`
          : `✅ *Güncellendi!*\n\n\`\`\`\n${output}\n\`\`\`\n\n⚠️ Değişikliklerin aktif olması için botu yeniden başlat:\n\`Ctrl+C → npx tsx dev-bot.ts\``,
        { parse_mode: "Markdown" }
      );
    });
  });

  // /memory — kullanıcının Honcho'daki profilini göster
  bot.command("memory", async (ctx) => {
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
    if (text.startsWith("/")) return;
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
  const action = await parseIntent(text, userContext);

  let response = "";

  switch (action.type) {
    case "send": {
      let to = action.to;

      // İsimle gönderim: "Ali'ye gönder" → adres çözümle
      if ((!to || !to.startsWith("0x")) && action.name && userId) {
        const resolved = await resolveNameToAddress(userId, action.name);
        if (!resolved) {
          response = `🤔 "${action.name}" adına kayıtlı adres bulunamadı.\n\nŞunu dene: \`/allow 0x... ${action.name}\``;
          await ctx.reply(response, { parse_mode: "Markdown" });
          break;
        }
        to = resolved;
      }

      // İlk kez gönderilen adres uyarısı
      if (userId && to.startsWith("0x")) {
        const known = await isKnownAddress(userId, to);
        if (!known) {
          await ctx.reply(
            `⚠️ *Yeni adres!*\n\n\`${to}\`\n\nBu adrese daha önce göndermemişsin. Devam etmek için tekrar "evet gönder ${action.amount} USDC to ${to}" yaz.`,
            { parse_mode: "Markdown" }
          );
          break;
        }
      }

      const msg = await ctx.reply("⏳ İşlem hazırlanıyor...");
      response = await sendUSDC(to, action.amount);
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
    case "price": {
      const msg = await ctx.reply("⏳ Fiyat alınıyor...");
      response = await getETHPrice();
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response, {
        parse_mode: "Markdown",
      });
      break;
    }
    case "bridge": {
      const msg = await ctx.reply(`⏳ Li.Fi route bulunuyor (${action.fromChain} → ${action.toChain})...`);
      response = await bridge(action.fromChain, action.toChain, action.fromToken, action.amount, action.toToken);
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
      const msg = await ctx.reply("⏳ ETH → USDC swap...");
      response = await swapETHtoUSDC(action.amount, action.dex);
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response, {
        parse_mode: "Markdown",
      });
      break;
    }
    case "swap_usdc_eth": {
      const msg = await ctx.reply("⏳ USDC → ETH swap...");
      response = await swapUSDCtoETH(action.amount, action.dex);
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, response, {
        parse_mode: "Markdown",
      });
      break;
    }
    case "unknown": {
      response = action.message;
      await ctx.reply(`🤔 ${action.message}\n\n/help yazarak ne yapabileceğimi görebilirsin.`);
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
