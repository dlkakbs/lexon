/**
 * MoonPay CLI skill — cross-chain swaps, bridges, DCA, limit orders.
 * Requires `mp` CLI installed: npm i -g @moonpay/cli
 * Docs: https://github.com/moonpay/skills
 */

import { exec } from "child_process";
import { promisify } from "util";
import { config } from "../config";

const execAsync = promisify(exec);

async function mp(args: string): Promise<any> {
  const { stdout, stderr } = await execAsync(`mp --json ${args}`);
  if (stderr && !stdout) throw new Error(stderr.trim());
  return JSON.parse(stdout.trim());
}

/** Token search / price lookup */
export async function searchToken(query: string, chain = "base"): Promise<string> {
  try {
    const result = await mp(`token search --query "${query}" --chain ${chain}`);
    const items: any[] = result?.items ?? [];
    if (items.length === 0) return `❌ "${query}" bulunamadı.`;

    const lines = items.slice(0, 5).map((t) => {
      const price = t?.marketData?.price?.toFixed(4) ?? "?";
      const change = t?.marketData?.change24h?.toFixed(2) ?? "?";
      const sign = parseFloat(change) >= 0 ? "+" : "";
      return `• *${t.name}* (${t.symbol}) — $${price} (${sign}${change}% 24s)`;
    });

    return `🔍 *Token Arama: "${query}"*\n\n${lines.join("\n")}`;
  } catch (err: any) {
    return `❌ Token aranamadı: ${err?.message?.slice(0, 80)}`;
  }
}
