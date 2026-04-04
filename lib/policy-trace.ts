import fs from "fs";
import path from "path";

import { getGuardUsageSummary } from "./guards";

const DATA_DIR = path.join(process.cwd(), "data");
const TRACE_PATH = path.join(DATA_DIR, "policy-trace.jsonl");

export type PolicyTraceEntry = {
  timestamp: string;
  decision: "allow" | "deny";
  requestedAction: string;
  requestedType: "send" | "swap" | "bridge";
  matchedRules: string[];
  reason?: string;
  guardCode?: string;
  denyReason?: string;
  executedAction?: string;
  executionTxHash?: string;
  details?: Record<string, unknown>;
  usage: ReturnType<typeof getGuardUsageSummary>;
};

export function extractTxHash(text: string): string | null {
  const match = text.match(/0x[a-fA-F0-9]{64}/);
  return match?.[0] ?? null;
}

export function logPolicyTrace(entry: Omit<PolicyTraceEntry, "timestamp" | "usage">) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const fullEntry: PolicyTraceEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    usage: getGuardUsageSummary(),
  };
  fs.appendFileSync(TRACE_PATH, `${JSON.stringify(fullEntry)}\n`);
}

export function readRecentPolicyTrace(limit = 6): PolicyTraceEntry[] {
  try {
    if (!fs.existsSync(TRACE_PATH)) return [];
    const lines = fs.readFileSync(TRACE_PATH, "utf-8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(-limit);
    return lines
      .map((line) => JSON.parse(line) as PolicyTraceEntry)
      .reverse();
  } catch {
    return [];
  }
}

export function formatPolicyTraceSummary(limit = 5): string {
  const recent = readRecentPolicyTrace(limit);
  const usage = getGuardUsageSummary();

  const header =
    `🛡 *Policy Trace*\n\n` +
    `Today: ${usage.usdcDailyTotal}/${usage.maxDailyUSDC} USDC · ${usage.txCount}/${usage.maxTxPerDay} tx\n` +
    `Cooldown: ${usage.cooldownRemainingSeconds > 0 ? `${usage.cooldownRemainingSeconds}s remaining` : "clear"}\n` +
    `Pending confirmations: ${usage.pendingConfirmations}\n`;

  if (recent.length === 0) {
    return `${header}\n_No policy decisions logged yet._`;
  }

  const lines = recent.map((entry) => {
    const stamp = new Date(entry.timestamp).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const verdict = entry.decision === "allow" ? "ALLOW" : "DENY";
    const detail = entry.decision === "allow"
      ? entry.executedAction || entry.reason || "executed"
      : entry.denyReason || entry.reason || "blocked";
    return `• ${stamp} · ${verdict} · ${entry.requestedAction}\n  ${detail}`;
  });

  return `${header}\n*Recent decisions:*\n${lines.join("\n")}`;
}
