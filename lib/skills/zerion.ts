const BASE_URL = "https://api.zerion.io/v1";

function authHeader(): string {
  const key = process.env.ZERION_API_KEY;
  if (!key) throw new Error("ZERION_API_KEY is not set");
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

async function zerionGet(path: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: authHeader(), Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`Zerion API error: ${res.status}`);
  return res.json();
}

/** Cüzdanın toplam portföy değerini ve zincir dağılımını döner */
export async function getPortfolio(address: string): Promise<string> {
  try {
    const data = await zerionGet(`/wallets/${address}/portfolio`, { currency: "usd" });
    const attr = data.data?.attributes;
    if (!attr) return "❌ Portföy verisi alınamadı.";

    const total = attr.total?.positions?.toFixed(2) ?? "?";
    const change1d = attr.changes?.absolute_1d?.toFixed(2) ?? "0";
    const pct1d = attr.changes?.percent_1d?.toFixed(2) ?? "0";
    const changeEmoji = parseFloat(change1d) >= 0 ? "📈" : "📉";

    const byChain = attr.positions_distribution_by_chain ?? {};
    const chainLines = Object.entries(byChain)
      .filter(([, v]) => (v as number) > 0.01)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 6)
      .map(([chain, val]) => `  • ${chain}: $${(val as number).toFixed(2)}`)
      .join("\n");

    const byType = attr.positions_distribution_by_type ?? {};
    const typeLines = Object.entries(byType)
      .filter(([, v]) => (v as number) > 0.01)
      .map(([type, val]) => `  • ${type}: $${(val as number).toFixed(2)}`)
      .join("\n");

    return (
      `💼 *Portföy*\n\n` +
      `**Toplam:** $${total} ${changeEmoji} ${change1d >= "0" ? "+" : ""}$${change1d} (%${pct1d} 24s)\n\n` +
      `*Zincir dağılımı:*\n${chainLines || "  —"}\n\n` +
      `*Tip dağılımı:*\n${typeLines || "  —"}`
    );
  } catch (err: any) {
    return `❌ Portföy alınamadı: ${err?.message?.slice(0, 80)}`;
  }
}

export async function getChainBalance(address: string, chainQuery: string): Promise<string> {
  try {
    const data = await zerionGet(`/wallets/${address}/portfolio`, { currency: "usd" });
    const attr = data.data?.attributes;
    if (!attr) return "❌ Portföy verisi alınamadı.";

    const byChain = attr.positions_distribution_by_chain ?? {};
    const entries = Object.entries(byChain) as Array<[string, number]>;
    const query = chainQuery.toLowerCase();
    const match = entries.find(([chain]) => chain.toLowerCase().includes(query));

    if (!match) {
      const known = entries
        .filter(([, value]) => value > 0.01)
        .map(([chain]) => chain)
        .slice(0, 8)
        .join(", ");
      return `❌ ${chainQuery} için bakiye bulunamadı.\n\nGörünen ağlar: ${known || "yok"}`;
    }

    const [chain, value] = match;
    return (
      `🌐 *Chain Balance*\n` +
      `\`${address.slice(0, 6)}...${address.slice(-4)}\`\n\n` +
      `*${chain}*: $${value.toFixed(2)}`
    );
  } catch (err: any) {
    return `❌ Chain balance alınamadı: ${err?.message?.slice(0, 80)}`;
  }
}

/** Token pozisyonlarını listeler */
export async function getPositions(address: string): Promise<string> {
  try {
    const data = await zerionGet(`/wallets/${address}/positions`, {
      currency: "usd",
      sort: "value",
    });

    const items: any[] = data.data ?? [];
    if (items.length === 0) return "📭 Pozisyon bulunamadı.";

    const lines = items
      .slice(0, 10)
      .map((item) => {
        const attr = item.attributes;
        const name = attr?.fungible_info?.name ?? attr?.name ?? "?";
        const symbol = attr?.fungible_info?.symbol ?? "";
        const value = attr?.value?.toFixed(2) ?? "?";
        const quantity = attr?.quantity?.float?.toFixed(4) ?? "?";
        const chain = attr?.chain ?? item.relationships?.chain?.data?.id ?? "";
        return `• *${name}* (${symbol}) — $${value}\n  ${quantity} @ ${chain}`;
      })
      .join("\n\n");

    return `📊 *Token Pozisyonları*\n\n${lines}`;
  } catch (err: any) {
    return `❌ Pozisyonlar alınamadı: ${err?.message?.slice(0, 80)}`;
  }
}

/** Son işlemleri human-readable gösterir */
export async function getTransactionHistory(address: string): Promise<string> {
  try {
    const data = await zerionGet(`/wallets/${address}/transactions`, {
      currency: "usd",
      "page[size]": "8",
    });

    const items: any[] = data.data ?? [];
    if (items.length === 0) return "📭 İşlem bulunamadı.";

    const lines = items.map((item) => {
      const attr = item.attributes;
      const type = attr?.operation_type ?? "transfer";
      const status = attr?.status === "confirmed" ? "✅" : "⏳";
      const date = attr?.mined_at
        ? new Date(attr.mined_at).toLocaleDateString("tr-TR")
        : "";

      const transfers: any[] = attr?.transfers ?? [];
      const summary =
        transfers.length > 0
          ? transfers
              .slice(0, 2)
              .map((t: any) => {
                const sym = t?.fungible_info?.symbol ?? t?.asset?.symbol ?? "?";
                const qty = t?.quantity?.float?.toFixed(4) ?? "";
                const dir = t?.direction === "in" ? "⬇" : "⬆";
                return `${dir}${qty} ${sym}`;
              })
              .join(" ")
          : type;

      return `${status} ${date} — ${summary}`;
    });

    return `🧾 *Son İşlemler*\n\n${lines.join("\n")}`;
  } catch (err: any) {
    return `❌ İşlemler alınamadı: ${err?.message?.slice(0, 80)}`;
  }
}
