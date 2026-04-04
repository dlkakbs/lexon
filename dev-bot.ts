// Local dev: runs the same bot handlers in polling mode.
// Usage: npx tsx dev-bot.ts

import { Bot } from "grammy";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

async function main() {
  const { registerHandlers } = await import("./lib/bot");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  const bot = new Bot(token);
  registerHandlers(bot, token);

  console.log("🤖 Lexon bot started (polling mode)...");
  bot.start().catch((err) => {
    console.error("Bot error:", err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("Bot bootstrap error:", err);
  process.exit(1);
});
