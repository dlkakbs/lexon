import { config } from "./config";

export type Action =
  | { type: "send"; to: string; amount: string; name?: string }
  | { type: "balance"; address?: string }
  | { type: "swap_eth_usdc"; amount: string; dex?: string }
  | { type: "swap_usdc_eth"; amount: string; dex?: string }
  | { type: "price" }
  | { type: "spending_summary" }
  | { type: "portfolio"; address?: string }
  | { type: "wallet_score"; address?: string }
  | { type: "wallet_patterns"; address?: string }
  | { type: "positions"; address?: string }
  | { type: "tx_history"; address?: string }
  | { type: "research_query"; query: string }
  | { type: "bridge"; fromChain: string; toChain: string; fromToken: string; amount: string; toToken?: string }
  | { type: "token_search"; query: string; chain?: string }
  | { type: "help" }
  | { type: "unknown"; message: string };

function buildSystemPrompt(userContext: string): string {
  return `You are Lexon, a DeFi assistant that parses natural language commands into structured actions on Base network.

Extract the user's intent and return ONLY valid JSON matching one of these schemas:

1. Send USDC (address known):
{"type":"send","to":"0x...","amount":"5.00"}

2. Send USDC (by name/nickname — no 0x address given):
{"type":"send","to":"","amount":"5.00","name":"Ali"}

3. Check balance:
{"type":"balance","address":"0x..."} or {"type":"balance"} for own wallet

4. Swap ETH → USDC:
{"type":"swap_eth_usdc","amount":"0.001","dex":"uniswap_v3"}

5. Swap USDC → ETH:
{"type":"swap_usdc_eth","amount":"3.00","dex":"aerodrome"}

Supported dex values: "uniswap_v3" (default), "uniswap_universal", "aerodrome"
If user doesn't specify a DEX, use "uniswap_v3" as default.

6. ETH price check:
{"type":"price"}
Triggers: "price", "fiyat", "ETH ne kadar", "how much is ETH"

7. Spending summary (Lexon wallet's own tx log):
{"type":"spending_summary"}
Triggers: "ne harcadım", "harcama", "spending", "history", "geçmiş"

8. Portfolio across all chains (Zerion):
{"type":"portfolio","address":"0x..."} or {"type":"portfolio"} for own wallet
Triggers: "portföy", "portfolio", "varlıklarım", "assets", "holdings", "show my wallet"

9. Wallet score on Base (Allium):
{"type":"wallet_score","address":"0x..."} or {"type":"wallet_score"}
Triggers: "score wallet", "wallet score", "risk score", "bu cüzdan güvenli mi", "adres skoru"

10. Wallet patterns on Base (Allium):
{"type":"wallet_patterns","address":"0x..."} or {"type":"wallet_patterns"}
Triggers: "wallet patterns", "recent activity", "bu adres ne yapıyor", "son aktiviteler", "davranış analizi"

11. Token positions (Zerion):
{"type":"positions","address":"0x..."} or {"type":"positions"}
Triggers: "pozisyon", "positions", "token", "coins", "DeFi pozisyon", "staking", "LP"

12. Transaction history across chains (Zerion):
{"type":"tx_history","address":"0x..."} or {"type":"tx_history"}
Triggers: "son işlemler", "transactions", "tx history", "geçmiş işlemler"

13. Paid deep market research via remote x402 capability:
{"type":"research_query","query":"Base vs Arbitrum stablecoin activity this week"}
Triggers: "research", "araştır", "compare", "karşılaştır", "market research", "brief", "thesis"

14. Cross-chain bridge via Li.Fi (OWS signs):
{"type":"bridge","fromChain":"base","toChain":"polygon","fromToken":"USDC","amount":"5"}
{"type":"bridge","fromChain":"base","toChain":"arbitrum","fromToken":"ETH","amount":"0.01"}
{"type":"bridge","fromChain":"base","toChain":"polygon","fromToken":"ETH","amount":"0.01","toToken":"USDC"}
Triggers: "bridge", "cross-chain", "Polygon'a gönder", "Arbitrum'a ETH gönder", "Ethereum'a USDC bridge et"
fromChain is always "base". fromToken: "ETH" or "USDC". toToken optional (default = same as fromToken).
Supported toChains: ethereum, polygon, arbitrum, optimism, bnb, avalanche, zksync, linea, scroll, blast, mantle, unichain, sonic, berachain, gnosis, celo

15. Token search / price:
{"type":"token_search","query":"PEPE","chain":"base"}
Triggers: "token bul", "search token", "PEPE nedir", "hangi chain", adres bilmeden token sorgusu

16. Help:
{"type":"help"}

17. Unknown:
{"type":"unknown","message":"Explain what you can't understand in English"}

Rules:
- "amount" must be a string with max 6 decimal places
- "to" must be a valid 0x Ethereum address (or empty string if only name given)
- Swap triggers: "swap", "exchange", "convert", "buy ETH", "buy USDC"
- If user says "swap 3 USDC to ETH" → swap_usdc_eth with amount "3"
- If user says "swap 0.001 ETH to USDC" or "buy USDC with ETH" → swap_eth_usdc
- If user mentions a person's name instead of 0x address → use "name" field
- Respond ONLY with the JSON object, no other text

${userContext ? `USER CONTEXT (from memory):\n${userContext}` : ""}`.trim();
}

function buildChatPrompt(userContext: string): string {
  return `You are Lexon, a conversational wallet operator for AI agents on Base.

You can chat naturally with the user, explain what you do, answer product questions, and discuss DeFi workflows in a helpful way.

Rules:
- Reply naturally, not as JSON
- Keep the tone concise, warm, and competent
- If the user is casually chatting, chat back normally
- If the user asks what you can do, explain your capabilities clearly
- Do not claim an action was executed unless the execution flow actually ran
- For sensitive actions like send, swap, or bridge, tell the user to state the action clearly
- If you're unsure about live market facts, say so briefly instead of inventing data

${userContext ? `USER CONTEXT (from memory):\n${userContext}` : ""}`.trim();
}

async function callLLM(systemPrompt: string, userText: string, maxTokens = 256): Promise<string> {
  const { aiProvider, aiModel } = config;

  // ── OpenRouter (default) ──────────────────────────────────────────────────
  if (aiProvider === "openrouter") {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Lexon",
      },
      body: JSON.stringify({
        model: aiModel,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  // ── Anthropic direct ─────────────────────────────────────────────────────
  if (aiProvider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel || "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userText }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text?.trim() ?? "";
  }

  // ── OpenAI ───────────────────────────────────────────────────────────────
  if (aiProvider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel || "gpt-4o-mini",
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  throw new Error(`Unknown AI provider: ${aiProvider}`);
}

export async function parseIntent(text: string, userContext = ""): Promise<Action> {
  const deterministic = classifyToolIntent(text);
  if (deterministic) return deterministic;

  try {
    const raw = await callLLM(buildSystemPrompt(userContext), text);
    if (!raw) throw new Error("Empty response");
    return JSON.parse(raw) as Action;
  } catch {
    return {
      type: "unknown",
      message: "Komutu anlayamadım. /help yazarak neler yapabileceğimi görebilirsin.",
    };
  }
}

export async function generateChatReply(text: string, userContext = ""): Promise<string> {
  try {
    const reply = await callLLM(buildChatPrompt(userContext), text, 400);
    if (reply?.trim()) return reply.trim();
  } catch {}

  return "İyiyim. Ben Lexon; Base üzerinde çalışan bir wallet operator agent’ıyım. İstersen transfer, swap, bridge, wallet analysis ya da capability flow’ları konusunda yardımcı olabilirim.";
}

function classifyToolIntent(text: string): Action | null {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();
  const address = normalized.match(/0x[a-fA-F0-9]{40}/)?.[0];

  const walletScoreHints = [
    "wallet score",
    "score wallet",
    "risk score",
    "adres skoru",
    "bu cüzdan güvenli mi",
    "wallet risk",
    "riskli mi",
    "şüpheli mi",
    "suspicious wallet",
    "wallet safety",
  ];
  if (walletScoreHints.some((hint) => lower.includes(hint))) {
    return { type: "wallet_score", address };
  }

  const walletPatternHints = [
    "wallet patterns",
    "recent activity",
    "son aktiviteler",
    "bu adres ne yapıyor",
    "davranış analizi",
    "wallet activity",
    "activity summary",
    "wallet behavior",
    "onchain pattern",
    "onchain davranış",
  ];
  if (walletPatternHints.some((hint) => lower.includes(hint))) {
    return { type: "wallet_patterns", address };
  }

  const researchHints = [
    "research",
    "market research",
    "brief",
    "thesis",
    "compare",
    "compare protocols",
    "protocol compare",
    "karşılaştır",
    "araştır",
    "analiz et",
    "market update",
    "market outlook",
    "sentiment",
    "news brief",
    "narrative",
  ];
  if (researchHints.some((hint) => lower.includes(hint))) {
    return { type: "research_query", query: normalized };
  }

  return null;
}
