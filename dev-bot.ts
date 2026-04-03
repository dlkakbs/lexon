// Local dev: runs bot in polling mode (no public URL needed)
// Usage: npx tsx dev-bot.ts

import { Bot } from "grammy";
import { parseIntent } from "./lib/intent";
import { transcribeVoice } from "./lib/voice";
import { sendUSDC } from "./lib/actions/send";
import { checkBalance } from "./lib/actions/balance";
import { getWalletAddress } from "./lib/wallet";

// Load .env.local
import { config } from "dotenv";
const result = config({ path: ".env.local" });
console.log("dotenv:", result.error || "OK");
console.log("TOKEN:", process.env.TELEGRAM_BOT_TOKEN ? "SET" : "MISSING");
console.log("OPENROUTER:", process.env.OPENROUTER_API_KEY ? "SET" : "MISSING");

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new Bot(token);

const HELP_TEXT = `
🔷 *Lexon* — Base üzerinde doğal dil ile DeFi

💸 *USDC Gönder*
"0x1234...abcd adresine 1.5 USDC gönder"

💰 *Bakiye Sorgula*
"Bakiyem ne kadar?"

🎙 Sesli mesaj da çalışır.

/cuzdan — cüzdan adresini göster
/yardim — bu menü
`.trim();

bot.command("start", async (ctx) => {
  await ctx.reply(`Merhaba! 👋 Ben *Lexon*\n\n${HELP_TEXT}`, { parse_mode: "Markdown" });
});

bot.command(["yardim", "help"], async (ctx) => {
  await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
});

bot.command("cuzdan", async (ctx) => {
  const address = getWalletAddress();
  await ctx.reply(`🔷 *Lexon Cüzdanı*\n\n\`${address}\`\n\n[Basescan](https://basescan.org/address/${address})`, {
    parse_mode: "Markdown",
  });
});

bot.on("message:text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) return;
  await ctx.replyWithChatAction("typing");
  const action = await parseIntent(ctx.message.text);
  await handle(ctx, action);
});

bot.on("message:voice", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  try {
    const file = await ctx.getFile();
    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    const transcript = await transcribeVoice(buffer);
    await ctx.reply(`🎙 _"${transcript}"_`, { parse_mode: "Markdown" });
    const action = await parseIntent(transcript);
    await handle(ctx, action);
  } catch {
    await ctx.reply("❌ Ses mesajı işlenemedi.");
  }
});

async function handle(ctx: any, action: any) {
  switch (action.type) {
    case "send": {
      const msg = await ctx.reply("⏳ İşlem hazırlanıyor...");
      const result = await sendUSDC(action.to, action.amount);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, result, { parse_mode: "Markdown" });
      break;
    }
    case "balance": {
      const address = action.address || getWalletAddress();
      const result = await checkBalance(address);
      await ctx.reply(result, { parse_mode: "Markdown" });
      break;
    }
    case "help":
      await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
      break;
    case "unknown":
      await ctx.reply(`🤔 ${action.message}`);
      break;
  }
}

console.log("🤖 Lexon bot başlatıldı (polling mode)...");
bot.start().catch((err) => {
  console.error("Bot başlatma hatası:", err);
  process.exit(1);
});
