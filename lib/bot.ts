import { Bot, Context, webhookCallback } from "grammy";
import { parseIntent } from "./intent";
import { transcribeVoice } from "./voice";
import { sendUSDC } from "./actions/send";
import { checkBalance } from "./actions/balance";
import { getWalletAddress } from "./wallet";
import { addToAllowlist, removeFromAllowlist, getAllowlist } from "./allowlist";

const HELP_TEXT = `
🔷 *Lexon* — DeFi on Base via natural language

*What you can do:*

💸 *Send USDC*
"Send 1.5 USDC to 0x1234...abcd"
"Pay 2 dollars to 0xabc..."

💰 *Check Balance*
"What's my balance?"
"Check balance of 0x1234..."

🎙 *Voice Commands*
Send a voice note — Whisper transcribes it automatically.

⚙️ *Security Limits*
• Max $2 USDC / transaction
• Max $10 USDC / day
• Only allowlisted addresses

/wallet — Show Lexon wallet address
/list — Show allowed addresses
/allow <address> [label] — Add address to allowlist
/remove <address> — Remove address from allowlist
/help — This menu
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

  // /allow 0x123... MyFriend
  bot.command("allow", async (ctx) => {
    const parts = ctx.message.text.split(" ").slice(1);
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
    const address = ctx.message.text.split(" ")[1];
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
      await ctx.reply("❌ Could not process voice message.");
    }
  });
}

async function handleCommand(ctx: Context, override?: string) {
  const text = override ?? (ctx.message as any)?.text ?? "";
  const action = await parseIntent(text);

  switch (action.type) {
    case "send": {
      const msg = await ctx.reply("⏳ Preparing transaction...");
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
        `🤔 ${action.message}\n\nType /help to see what I can do.`
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
