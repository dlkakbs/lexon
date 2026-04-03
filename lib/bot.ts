import { Bot, Context, webhookCallback } from "grammy";
import { parseIntent } from "./intent";
import { transcribeVoice } from "./voice";
import { sendUSDC } from "./actions/send";
import { checkBalance } from "./actions/balance";
import { getWalletAddress } from "./wallet";

const HELP_TEXT = `
🔷 *Lexon* — Base üzerinde doğal dil ile DeFi

*Neler yapabilirsin:*

💸 *USDC Gönder*
"0x1234...abcd adresine 1.5 USDC gönder"
"Send $2 to 0xabc..."

💰 *Bakiye Sorgula*
"Bakiyem ne kadar?"
"0x1234... adresinin bakiyesi?"

🎙 *Sesli komut*
Yukarıdaki komutları sesli mesaj olarak da gönderebilirsin.

⚙️ *Limitler (güvenlik)*
• Max $2 USDC / işlem
• Max $10 USDC / gün

/cuzdan — Lexon cüzdan adresini göster
/yardim — Bu menü
`.trim();

function registerHandlers(bot: Bot, token: string) {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      `Merhaba! 👋 Ben *Lexon* — Base üzerinde işlem yapmanı kolaylaştıran AI asistanın.\n\n` +
      `Türkçe veya İngilizce yazabilirsin. Sesli mesaj da çalışır.\n\n` +
      HELP_TEXT,
      { parse_mode: "Markdown" }
    );
  });

  bot.command(["yardim", "help"], async (ctx) => {
    await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
  });

  bot.command("cuzdan", async (ctx) => {
    try {
      const address = getWalletAddress();
      await ctx.reply(
        `🔷 *Lexon Cüzdanı*\n\n` +
        `\`${address}\`\n\n` +
        `[Basescan'de görüntüle](https://basescan.org/address/${address})`,
        { parse_mode: "Markdown" }
      );
    } catch {
      await ctx.reply("❌ Cüzdan bilgisi alınamadı.");
    }
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
      await ctx.reply(`🎙 _"${transcript}"_`, { parse_mode: "Markdown" });
      await handleCommand(ctx, transcript);
    } catch {
      await ctx.reply("❌ Ses mesajı işlenemedi.");
    }
  });
}

async function handleCommand(ctx: Context, override?: string) {
  const text = override ?? (ctx.message as any)?.text ?? "";
  const action = await parseIntent(text);

  switch (action.type) {
    case "send": {
      const msg = await ctx.reply("⏳ İşlem hazırlanıyor...");
      const result = await sendUSDC(action.to, action.amount);
      await ctx.api.editMessageText(ctx.chat!.id, msg.message_id, result, {
        parse_mode: "Markdown",
      });
      break;
    }
    case "balance": {
      const address = action.address || getWalletAddress();
      const result = await checkBalance(address);
      await ctx.reply(result, { parse_mode: "Markdown" });
      break;
    }
    case "help": {
      await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
      break;
    }
    case "unknown": {
      await ctx.reply(
        `🤔 ${action.message}\n\n/yardim yazarak ne yapabileceğimi görebilirsin.`
      );
      break;
    }
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
