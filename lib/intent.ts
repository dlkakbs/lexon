export type Action =
  | { type: "send"; to: string; amount: string }
  | { type: "balance"; address?: string }
  | { type: "help" }
  | { type: "unknown"; message: string };

const SYSTEM_PROMPT = `You are Lexon, a DeFi assistant that parses natural language commands into structured actions on Base network.

Extract the user's intent and return ONLY valid JSON matching one of these schemas:

1. Send USDC:
{"type":"send","to":"0x...","amount":"5.00"}

2. Check balance (own wallet or specific address):
{"type":"balance","address":"0x..."}
or {"type":"balance"} for own wallet

3. Help:
{"type":"help"}

4. Unknown:
{"type":"unknown","message":"Explain what you can't understand in Turkish"}

Rules:
- "amount" must be a string with max 2 decimal places
- "to" must be a valid 0x Ethereum address
- If user says "cüzdanım", "bakiyem", "balance" with no address → use {"type":"balance"}
- Respond ONLY with the JSON object, no other text
- If unsure, use "unknown" with a helpful Turkish explanation`;

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
