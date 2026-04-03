// Local dev: runs bot in polling mode (no public URL needed)
// Usage: npx tsx dev-bot.ts

import { Bot } from "grammy";
import { parseIntent } from "./lib/intent";
import { transcribeVoice } from "./lib/voice";
import { sendUSDC } from "./lib/actions/send";
import { checkBalance } from "./lib/actions/balance";
import { getWalletAddress } from "./lib/wallet";
import { addToAllowlist, removeFromAllowlist, getAllowlist } from "./lib/allowlist";
import { swapETHtoUSDC, swapUSDCtoETH } from "./lib/actions/swap";

import { config } from "dotenv";
config({ path: ".env.local" });

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new Bot(token);

const HELP_TEXT = `
🔷 *Lexon* — DeFi on Base via natural language

💸 *Send USDC*
"Send 1.5 USDC to 0x1234...abcd"

💰 *Check Balance*
"What's my balance?"

🎙 Voice notes work too.

/wallet — Show wallet address
/list — Show allowed addresses
/allow <address> [label] — Add to allowlist
/remove <address> — Remove from allowlist
/help — This menu
`.trim();

bot.command("start", async (ctx) => {
  await ctx.reply(`👋 Hey! I'm *Lexon*\n\n${HELP_TEXT}`, { parse_mode: "Markdown" });
});

bot.command("help", async (ctx) => {
  await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
});

bot.command("wallet", async (ctx) => {
  const address = getWalletAddress();
  await ctx.reply(
    `🔷 *Lexon Wallet*\n\n\`${address}\`\n\n[View on Basescan](https://basescan.org/address/${address})`,
    { parse_mode: "Markdown" }
  );
});

bot.command("allow", async (ctx) => {
  const parts = (ctx.message?.text ?? "").split(" ").slice(1);
  const address = parts[0];
  const label = parts.slice(1).join(" ") || "Personal";
  if (!address?.startsWith("0x")) {
    await ctx.reply("Usage: `/allow 0x... Label`", { parse_mode: "Markdown" });
    return;
  }
  addToAllowlist(address, label);
  await ctx.reply(`✅ Added: \`${address}\` — ${label}`, { parse_mode: "Markdown" });
});

bot.command("remove", async (ctx) => {
  const address = (ctx.message?.text ?? "").split(" ")[1];
  if (!address?.startsWith("0x")) {
    await ctx.reply("Usage: `/remove 0x...`", { parse_mode: "Markdown" });
    return;
  }
  removeFromAllowlist(address);
  await ctx.reply(`🗑 Removed: \`${address}\``, { parse_mode: "Markdown" });
});

bot.command("list", async (ctx) => {
  const all = getAllowlist();
  const entries = Object.entries(all);
  if (!entries.length) { await ctx.reply("No addresses in allowlist."); return; }
  const lines = entries.map(([addr, label]) => `• \`${addr.slice(0, 6)}...${addr.slice(-4)}\` — ${label}`);
  await ctx.reply(`📋 *Allowed Addresses*\n\n${lines.join("\n")}`, { parse_mode: "Markdown" });
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
    await ctx.reply("❌ Could not process voice message.");
  }
});

async function handle(ctx: any, action: any) {
  switch (action.type) {
    case "send": {
      const msg = await ctx.reply("⏳ Preparing transaction...");
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
    case "swap_eth_usdc": {
      const msg = await ctx.reply("⏳ Swapping ETH → USDC...");
      const result = await swapETHtoUSDC(action.amount);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, result, { parse_mode: "Markdown" });
      break;
    }
    case "swap_usdc_eth": {
      const msg = await ctx.reply("⏳ Swapping USDC → ETH...");
      const result = await swapUSDCtoETH(action.amount);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, result, { parse_mode: "Markdown" });
      break;
    }
    case "unknown":
      await ctx.reply(`🤔 ${action.message}\n\nType /help to see what I can do.`);
      break;
  }
}

console.log("🤖 Lexon bot started (polling mode)...");
bot.start().catch((err) => {
  console.error("Bot error:", err);
  process.exit(1);
});
