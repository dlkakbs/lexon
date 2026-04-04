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

function peerId(actorKey: string): string {
  return actorKey;
}

export function createActorKey(transport: string, actorId: string | number): string {
  return `${transport}-${String(actorId)}`;
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
  return logInteractionForActor(createActorKey("telegram", telegramUserId), userText, agentResponse);
}

export async function logInteractionForActor(
  actorKey: string,
  userText: string,
  agentResponse: string
): Promise<void> {
  try {
    const honcho = getClient();
    const user = await honcho.peer(peerId(actorKey));
    const bot = await honcho.peer("lexon-bot");
    const session = await honcho.session(`session-${actorKey}-${Date.now()}`);
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
  return queryMemoryForActor(createActorKey("telegram", telegramUserId), question);
}

export async function queryMemoryForActor(
  actorKey: string,
  question: string
): Promise<string | null> {
  try {
    const honcho = getClient();
    const user = await honcho.peer(peerId(actorKey));
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
  return getUserContextForActor(createActorKey("telegram", telegramUserId));
}

export async function getUserContextForActor(actorKey: string): Promise<string> {
  const result = await queryMemoryForActor(
    actorKey,
    "Summarize this user's DeFi habits: preferred DEX, frequent addresses, typical amounts, language preference. Be concise (2-3 sentences max)."
  );
  return result ?? "";
}

/**
 * Harcama özeti sorgular.
 */
export async function getSpendingSummary(telegramUserId: number): Promise<string> {
  return getSpendingSummaryForActor(createActorKey("telegram", telegramUserId));
}

export async function getSpendingSummaryForActor(actorKey: string): Promise<string> {
  const result = await queryMemoryForActor(
    actorKey,
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
  return resolveNameToAddressForActor(createActorKey("telegram", telegramUserId), name);
}

export async function resolveNameToAddressForActor(
  actorKey: string,
  name: string
): Promise<string | null> {
  const result = await queryMemoryForActor(
    actorKey,
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
  return isKnownAddressForActor(createActorKey("telegram", telegramUserId), address);
}

export async function isKnownAddressForActor(
  actorKey: string,
  address: string
): Promise<boolean> {
  const result = await queryMemoryForActor(
    actorKey,
    `Has this user ever sent USDC to address ${address} before? Answer only yes or no.`
  );
  return result?.toLowerCase().includes("yes") ?? false;
}
