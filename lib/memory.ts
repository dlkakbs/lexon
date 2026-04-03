import { Honcho } from "@honcho-ai/sdk";

let _honcho: InstanceType<typeof Honcho> | null = null;

function getClient(): InstanceType<typeof Honcho> {
  if (!_honcho) {
    const apiKey = process.env.HONCHO_API_KEY;
    if (!apiKey) throw new Error("HONCHO_API_KEY is not set");
    _honcho = new Honcho({ apiKey, workspaceId: "lexon" });
  }
  return _honcho;
}

/** Her Telegram kullanıcısına ait peer id */
function peerId(telegramUserId: number): string {
  return `telegram-${telegramUserId}`;
}

/**
 * Kullanıcı ile bot arasındaki bir etkileşimi Honcho'ya yazar.
 * Bot her mesajdan sonra çağırır.
 */
export async function logInteraction(
  telegramUserId: number,
  userText: string,
  agentResponse: string
): Promise<void> {
  try {
    const honcho = getClient();
    const user = await honcho.peer(peerId(telegramUserId));
    const bot = await honcho.peer("lexon-bot");
    const session = await honcho.session(`session-${telegramUserId}-${Date.now()}`);
    await session.addPeers([user, bot]);
    await session.addMessages([
      user.message(userText),
      bot.message(agentResponse),
    ]);
  } catch {
    // Memory logging is best-effort — never break the main flow
  }
}

/**
 * Kullanıcının hafızasına doğal dil sorgusu atar.
 * Örnek: "Bu kullanıcı en çok hangi adreslere gönderiyor?"
 */
export async function queryMemory(
  telegramUserId: number,
  question: string
): Promise<string | null> {
  try {
    const honcho = getClient();
    const user = await honcho.peer(peerId(telegramUserId));
    return await user.chat(question);
  } catch {
    return null;
  }
}

/**
 * Kullanıcının kısa dönem bağlamını döner — intent parsing'e eklenir.
 * Claude'a "bu kullanıcı genelde ne yapar" bilgisini verir.
 */
export async function getUserContext(telegramUserId: number): Promise<string> {
  const result = await queryMemory(
    telegramUserId,
    "Summarize this user's DeFi habits: preferred DEX, frequent addresses, typical amounts, language preference. Be concise (2-3 sentences max)."
  );
  return result ?? "";
}

/**
 * Harcama özeti sorgular.
 */
export async function getSpendingSummary(telegramUserId: number): Promise<string> {
  const result = await queryMemory(
    telegramUserId,
    "List all USDC transactions this user has made: amounts, recipient addresses, and dates if available. Format as a bullet list."
  );
  return result ?? "Henüz kayıtlı işlem bulunamadı.";
}

/**
 * İsme göre adres çözümlemeye çalışır.
 * "Ali'ye gönder" → Honcho'ya sorar → "0xabc..."
 */
export async function resolveNameToAddress(
  telegramUserId: number,
  name: string
): Promise<string | null> {
  const result = await queryMemory(
    telegramUserId,
    `Does this user have a contact or address labeled "${name}"? If yes, return ONLY the 0x Ethereum address. If no, return null.`
  );
  if (!result) return null;
  const match = result.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

/**
 * Bu adrese daha önce gönderilmiş mi kontrol eder.
 * İlk kez gönderiliyorsa uyarı için kullanılır.
 */
export async function isKnownAddress(
  telegramUserId: number,
  address: string
): Promise<boolean> {
  const result = await queryMemory(
    telegramUserId,
    `Has this user ever sent USDC to address ${address} before? Answer only yes or no.`
  );
  return result?.toLowerCase().includes("yes") ?? false;
}
