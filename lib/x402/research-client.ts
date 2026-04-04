import { config } from "../config";
import { getX402Fetch } from "./client";

function buildResearchUrl(query: string): string {
  if (!config.remoteResearchUrl) {
    throw new Error("X402_REMOTE_RESEARCH_URL is not set");
  }

  const url = new URL(config.remoteResearchUrl);
  url.searchParams.set("q", query);
  return url.toString();
}

function normalizeResearchResponse(data: any): string {
  const title = data?.title || data?.topic || "Research Result";
  const summary =
    data?.summary ||
    data?.result ||
    data?.answer ||
    data?.content ||
    data?.report;

  if (typeof summary === "string" && summary.trim()) {
    return `🧠 *${title}*\n\n${summary.trim()}`;
  }

  if (Array.isArray(data?.highlights) && data.highlights.length > 0) {
    const lines = data.highlights.slice(0, 5).map((item: any) => `• ${String(item)}`);
    return `🧠 *${title}*\n\n${lines.join("\n")}`;
  }

  return `🧠 *${title}*\n\n\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 1200)}\n\`\`\``;
}

export async function buyMarketResearch(query: string): Promise<string> {
  const trimmed = query.trim();
  if (!trimmed) return "❌ Araştırma sorusu boş olamaz.";

  const paidFetch = getX402Fetch();
  const url = buildResearchUrl(trimmed);

  const res = await paidFetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    return `❌ Research capability çağrısı başarısız: HTTP ${res.status}`;
  }

  const data = await res.json().catch(() => null);
  if (!data) {
    return "❌ Research capability geçerli bir JSON döndürmedi.";
  }

  return normalizeResearchResponse(data);
}
