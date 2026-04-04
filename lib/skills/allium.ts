const BASE_URL = "https://api.allium.so/api/v1/developer";

type AlliumAddressPayload = { chain: string; address: string };

function authHeaders(): Record<string, string> {
  const key = process.env.ALLIUM_API_KEY;
  if (!key) throw new Error("ALLIUM_API_KEY is not set");
  return {
    "Content-Type": "application/json",
    "X-API-KEY": key,
  };
}

async function alliumPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Allium API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

function basePayload(address: string): AlliumAddressPayload[] {
  return [{ chain: "base", address }];
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value);
  return 0;
}

function getBalanceUsd(item: any): number {
  return (
    asNumber(item?.current_balance?.amount) ||
    asNumber(item?.balance?.amount) ||
    asNumber(item?.value_usd) ||
    asNumber(item?.usd_value) ||
    asNumber(item?.token?.price) * asNumber(item?.balance?.amount) ||
    0
  );
}

function getTokenSymbol(item: any): string {
  return (
    item?.token?.info?.symbol ||
    item?.token?.symbol ||
    item?.asset?.symbol ||
    item?.symbol ||
    "?"
  );
}

function getTxTimestamp(tx: any): number {
  const raw = tx?.block_timestamp || tx?.timestamp || tx?.created_at;
  const parsed = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getTxSummary(tx: any): string {
  const labels: string[] = Array.isArray(tx?.labels)
    ? tx.labels.map((label: any) => label?.name || label?.label).filter(Boolean)
    : [];

  const activities: string[] = Array.isArray(tx?.activities)
    ? tx.activities.map((activity: any) => activity?.type || activity?.name).filter(Boolean)
    : [];

  const transfers: any[] = Array.isArray(tx?.asset_transfers)
    ? tx.asset_transfers
    : Array.isArray(tx?.transfers)
      ? tx.transfers
      : [];

  if (activities.length > 0) return activities.slice(0, 2).join(", ");
  if (labels.length > 0) return labels.slice(0, 2).join(", ");
  if (transfers.length > 0) {
    const pieces = transfers.slice(0, 2).map((transfer) => {
      const symbol =
        transfer?.token?.info?.symbol ||
        transfer?.asset?.symbol ||
        transfer?.fungible_info?.symbol ||
        "?";
      const amount =
        transfer?.amount?.amount_str ||
        transfer?.quantity?.float?.toFixed?.(4) ||
        transfer?.amount ||
        "";
      return `${amount} ${symbol}`.trim();
    });
    return pieces.join(" · ");
  }
  return tx?.hash ? `tx ${String(tx.hash).slice(0, 10)}...` : "activity";
}

async function getTransactions(address: string): Promise<any[]> {
  const data = await alliumPost<{ items?: any[]; error?: string }>("/wallet/transactions", basePayload(address));
  if (data.error) throw new Error(data.error);
  return Array.isArray(data.items) ? data.items : [];
}

async function getBalances(address: string): Promise<any[]> {
  const data = await alliumPost<{ items?: any[]; error?: string }>("/wallet/balances", basePayload(address));
  if (data.error) throw new Error(data.error);
  return Array.isArray(data.items) ? data.items : [];
}

function compactAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function humanizeAlliumError(err: any, mode: "score" | "patterns"): string {
  const message = err?.message || "";

  if (message.includes("ALLIUM_API_KEY is not set")) {
    return mode === "score"
      ? "❌ Wallet score şu an kullanılamıyor: `ALLIUM_API_KEY` ayarlı değil."
      : "❌ Wallet patterns şu an kullanılamıyor: `ALLIUM_API_KEY` ayarlı değil.";
  }

  if (message.includes("Allium API error: 401") || message.includes("Allium API error: 403")) {
    return mode === "score"
      ? "❌ Wallet score alınamadı: Allium API key geçersiz veya yetkisiz."
      : "❌ Wallet patterns alınamadı: Allium API key geçersiz veya yetkisiz.";
  }

  if (message.includes("Allium API error: 429")) {
    return mode === "score"
      ? "❌ Wallet score şu an rate limit'e takıldı. Biraz sonra tekrar dene."
      : "❌ Wallet patterns şu an rate limit'e takıldı. Biraz sonra tekrar dene.";
  }

  return mode === "score"
    ? `❌ Wallet score alınamadı: ${message.slice(0, 100) || "Bilinmeyen hata"}`
    : `❌ Wallet patterns alınamadı: ${message.slice(0, 100) || "Bilinmeyen hata"}`;
}

export async function scoreWallet(address: string): Promise<string> {
  try {
    const [transactions, balances] = await Promise.all([
      getTransactions(address),
      getBalances(address).catch(() => []),
    ]);

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recent = transactions.filter((tx) => getTxTimestamp(tx) >= sevenDaysAgo);
    const approvals = transactions.filter((tx) => {
      const activities = Array.isArray(tx?.activities) ? tx.activities : [];
      const labels = Array.isArray(tx?.labels) ? tx.labels : [];
      return (
        activities.some((a: any) => String(a?.type || a?.name || "").toLowerCase().includes("approve")) ||
        labels.some((l: any) => String(l?.name || l?.label || "").toLowerCase().includes("approve"))
      );
    }).length;

    const totalUsd = balances.reduce((sum, item) => sum + getBalanceUsd(item), 0);
    const topTokenUsd = balances.reduce((max, item) => Math.max(max, getBalanceUsd(item)), 0);
    const topTokenShare = totalUsd > 0 ? (topTokenUsd / totalUsd) * 100 : 0;

    let score = 50;
    if (recent.length >= 15) score += 20;
    else if (recent.length >= 5) score += 10;
    else if (recent.length === 0) score -= 15;

    if (approvals >= 5) score -= 10;
    else if (approvals === 0 && recent.length > 0) score += 5;

    if (balances.length >= 4) score += 10;
    if (topTokenShare >= 85) score -= 10;

    score = Math.max(0, Math.min(100, score));

    const flags: string[] = [];
    if (recent.length === 0) flags.push("No recent Base activity");
    if (approvals >= 5) flags.push("Approval-heavy recent activity");
    if (topTokenShare >= 85) flags.push("Highly concentrated balance");
    if (balances.length <= 1 && totalUsd > 0) flags.push("Low asset diversity");
    if (flags.length === 0) flags.push("No obvious activity flags");

    const level =
      score >= 75 ? "Stable" :
      score >= 55 ? "Moderate" :
      "Watch";

    return (
      `🧠 *Wallet Score*\n\n` +
      `Address: \`${compactAddress(address)}\`\n` +
      `Score: *${score}/100* · ${level}\n` +
      `Recent Base txs (7d): *${recent.length}*\n` +
      `Recent approvals: *${approvals}*\n` +
      `Tracked assets: *${balances.length}*\n` +
      `Top asset concentration: *${topTokenShare.toFixed(0)}%*\n\n` +
      `*Risk flags:*\n` +
      flags.map((flag) => `• ${flag}`).join("\n")
    );
  } catch (err: any) {
    return humanizeAlliumError(err, "score");
  }
}

export async function getWalletPatterns(address: string): Promise<string> {
  try {
    const [transactions, balances] = await Promise.all([
      getTransactions(address),
      getBalances(address).catch(() => []),
    ]);

    const recent = transactions
      .slice()
      .sort((a, b) => getTxTimestamp(b) - getTxTimestamp(a))
      .slice(0, 6);

    const patternLines = recent.map((tx) => {
      const ts = getTxTimestamp(tx);
      const date = ts ? new Date(ts).toLocaleDateString("tr-TR") : "unknown";
      return `• ${date} — ${getTxSummary(tx)}`;
    });

    const topBalances = balances
      .map((item) => ({ symbol: getTokenSymbol(item), usd: getBalanceUsd(item) }))
      .filter((item) => item.usd > 0)
      .sort((a, b) => b.usd - a.usd)
      .slice(0, 4);

    const tokenLines = topBalances.length > 0
      ? topBalances.map((item) => `• ${item.symbol}: $${item.usd.toFixed(2)}`).join("\n")
      : "• No balance data";

    const approvals = transactions.filter((tx) => {
      const activities = Array.isArray(tx?.activities) ? tx.activities : [];
      return activities.some((a: any) => String(a?.type || a?.name || "").toLowerCase().includes("approve"));
    }).length;

    return (
      `🧾 *Wallet Patterns*\n\n` +
      `Address: \`${compactAddress(address)}\`\n` +
      `Chain: *Base*\n` +
      `Recent tx count: *${transactions.length}*\n` +
      `Approval-like actions: *${approvals}*\n\n` +
      `*Recent activity:*\n${patternLines.join("\n") || "• No recent activity"}\n\n` +
      `*Top balances:*\n${tokenLines}`
    );
  } catch (err: any) {
    return humanizeAlliumError(err, "patterns");
  }
}
