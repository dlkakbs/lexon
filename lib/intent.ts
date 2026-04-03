export type Action =
  | { type: "send"; to: string; amount: string }
  | { type: "balance"; address?: string }
  | { type: "swap_eth_usdc"; amount: string; dex?: string }
  | { type: "swap_usdc_eth"; amount: string; dex?: string }
  | { type: "help" }
  | { type: "unknown"; message: string };

const SYSTEM_PROMPT = `You are Lexon, a DeFi assistant that parses natural language commands into structured actions on Base network.

Extract the user's intent and return ONLY valid JSON matching one of these schemas:

1. Send USDC:
{"type":"send","to":"0x...","amount":"5.00"}

2. Check balance:
{"type":"balance","address":"0x..."} or {"type":"balance"} for own wallet

3. Swap ETH → USDC:
{"type":"swap_eth_usdc","amount":"0.001","dex":"uniswap_v3"}

4. Swap USDC → ETH:
{"type":"swap_usdc_eth","amount":"3.00","dex":"aerodrome"}

Supported dex values: "uniswap_v3" (default), "uniswap_universal", "aerodrome"
If user doesn't specify a DEX, use "uniswap_v3" as default.

5. Help:
{"type":"help"}

6. Unknown:
{"type":"unknown","message":"Explain what you can't understand in English"}

Rules:
- "amount" must be a string with max 6 decimal places
- "to" must be a valid 0x Ethereum address
- Swap triggers: "swap", "exchange", "convert", "buy ETH", "buy USDC"
- If user says "swap 3 USDC to ETH" → swap_usdc_eth with amount "3"
- If user says "swap 0.001 ETH to USDC" or "buy USDC with ETH" → swap_eth_usdc
- Respond ONLY with the JSON object, no other text`;

export async function parseIntent(text: string): Promise<Action> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Lexon",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-6",
        max_tokens: 256,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error("Empty response");

    return JSON.parse(raw) as Action;
  } catch {
    return {
      type: "unknown",
      message: "Komutu anlayamadım. /yardim yazarak neler yapabileceğimi görebilirsin.",
    };
  }
}
