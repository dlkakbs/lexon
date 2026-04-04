import { config } from "./config";
import { generateChatReply, parseIntent, type Action } from "./intent";
import { sendUSDC } from "./actions/send";
import { checkBalance } from "./actions/balance";
import { getWalletAddress } from "./wallet";
import { swapETHtoUSDC, swapUSDCtoETH } from "./actions/swap";
import { getETHPrice } from "./skills/price";
import { getPortfolio, getPositions, getTransactionHistory, getChainBalance } from "./skills/zerion";
import { bridge } from "./skills/lifi";
import { searchToken } from "./skills/moonpay";
import { getWalletPatterns, scoreWallet } from "./skills/allium";
import { extractTxHash, logPolicyTrace } from "./policy-trace";
import { buyMarketResearch } from "./x402/research-client";
import {
  enforceTransactionGuards,
  getGuardUsageSummary,
  recordSuccessfulTransaction,
  requireHighValueConfirmation,
} from "./guards";
import {
  createActorKey,
  getSpendingSummaryForActor,
  getUserContextForActor,
  isKnownAddressForActor,
  logInteractionForActor,
  queryMemoryForActor,
  resolveNameToAddressForActor,
} from "./memory";

export type LexonTransport = "telegram" | "xmtp" | "dashboard";

export type LexonMessageHandle = {
  raw: unknown;
};

export type LexonReplyOptions = {
  markdown?: boolean;
};

export type LexonSession = {
  transport: LexonTransport;
  actorId?: string;
  conversationId?: string;
  reply: (text: string, options?: LexonReplyOptions) => Promise<LexonMessageHandle | null>;
  edit: (message: LexonMessageHandle, text: string, options?: LexonReplyOptions) => Promise<void>;
  typing?: () => Promise<void>;
};

function isSuccessfulResponse(response: string): boolean {
  return response.startsWith("✅");
}

function describeRequestedAction(
  kind: "send" | "swap" | "bridge",
  details: Record<string, string | number | undefined>
): string {
  if (kind === "send") {
    return `send ${details.amount ?? "?"} USDC to ${details.to ?? "recipient"}`;
  }
  if (kind === "swap") {
    return `swap ${details.amount ?? "?"} ${details.fromToken ?? "asset"} to ${details.toToken ?? "asset"}`;
  }
  return `bridge ${details.amount ?? "?"} ${details.fromToken ?? "asset"} from ${details.fromChain ?? "base"} to ${details.toChain ?? "destination"}`;
}

function describeExecutedAction(
  kind: "send" | "swap" | "bridge",
  details: Record<string, string | number | undefined>
): string {
  return describeRequestedAction(kind, details);
}

function getActorKey(session: LexonSession): string | null {
  if (!session.actorId) return null;
  return createActorKey(session.transport, session.actorId);
}

async function resolveTargetAddress(session: LexonSession, explicit?: string) {
  if (explicit?.match(/^0x[a-fA-F0-9]{40}$/)) return explicit;
  const actorKey = getActorKey(session);
  if (!actorKey) return getWalletAddress();
  const remembered = await queryMemoryForActor(
    actorKey,
    "What is this user's main wallet address? Return only the 0x address or null."
  ).catch(() => null);
  return remembered?.match(/0x[a-fA-F0-9]{40}/)?.[0] ?? getWalletAddress();
}

export function hasOwnerConfig(): boolean {
  return config.ownerIds.length > 0;
}

export function isOwner(session: LexonSession): boolean {
  return Boolean(session.actorId && config.ownerIds.includes(String(session.actorId)));
}

export async function requireOwner(session: LexonSession, capability: string): Promise<boolean> {
  if (!hasOwnerConfig()) {
    await session.reply(
      `🔒 \`${capability}\` için owner yetkisi gerekli.\n\nÖnce \`LEXON_OWNER_IDS\` ayarlamalısın.`,
      { markdown: true }
    );
    return false;
  }

  if (!isOwner(session)) {
    await session.reply(`⛔ Bu işlem sadece bot owner'ı için açık: \`${capability}\``, { markdown: true });
    return false;
  }

  return true;
}

export async function handleLexonMessage(session: LexonSession, text: string): Promise<string> {
  const actorKey = getActorKey(session);
  const userContext = actorKey ? await getUserContextForActor(actorKey) : "";
  const action = await parseIntent(text, userContext);

  const ownerOnlyActions = new Set<Action["type"]>([
    "send",
    "balance",
    "spending_summary",
    "portfolio",
    "wallet_score",
    "wallet_patterns",
    "positions",
    "tx_history",
    "research_query",
    "bridge",
    "swap_eth_usdc",
    "swap_usdc_eth",
  ]);

  if (ownerOnlyActions.has(action.type) && !(await requireOwner(session, action.type))) {
    return "";
  }

  let response = "";

  switch (action.type) {
    case "send": {
      let to = action.to;
      const amount = Number.parseFloat(action.amount);
      const requestedAction = describeRequestedAction("send", { amount: action.amount, to: action.to || action.name });

      if ((!to || !to.startsWith("0x")) && action.name && actorKey) {
        const resolved = await resolveNameToAddressForActor(actorKey, action.name);
        if (!resolved) {
          response = `🤔 "${action.name}" adına kayıtlı adres bulunamadı.\n\nŞunu dene: \`/allow 0x... ${action.name}\``;
          logPolicyTrace({
            decision: "deny",
            requestedType: "send",
            requestedAction,
            guardCode: "name_resolution_failed",
            matchedRules: ["recipient_resolution"],
            denyReason: `No address found for ${action.name}`,
          });
          await session.reply(response, { markdown: true });
          break;
        }
        to = resolved;
      }

      if (actorKey && to.startsWith("0x")) {
        const known = await isKnownAddressForActor(actorKey, to);
        if (!known) {
          logPolicyTrace({
            decision: "deny",
            requestedType: "send",
            requestedAction,
            guardCode: "recipient_not_trusted",
            matchedRules: ["recipient_allowlist"],
            denyReason: "Recipient is not yet trusted",
            details: { recipient: to },
          });
          response =
            `⚠️ *Yeni adres!*\n\n\`${to}\`\n\n` +
            `Bu adrese daha önce göndermemişsin. Devam etmek için aynı komutu tekrar gönder.`;
          await session.reply(response, { markdown: true });
          break;
        }
      }

      const confirmation = requireHighValueConfirmation(actorKey ?? undefined, { ...action, to }, amount);
      if (!confirmation.ok) {
        response = confirmation.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "send",
          requestedAction,
          guardCode: confirmation.code,
          matchedRules: confirmation.matchedRules,
          denyReason: confirmation.message,
          details: confirmation.details,
        });
        await session.reply(response, { markdown: true });
        break;
      }

      const guard = enforceTransactionGuards({
        kind: "send",
        amountUSDC: Number.isFinite(amount) ? amount : undefined,
        recipient: to,
      });
      if (!guard.ok) {
        response = guard.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "send",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          denyReason: guard.message,
          details: guard.details,
        });
        await session.reply(response, { markdown: true });
        break;
      }

      const msg = await session.reply("⏳ İşlem hazırlanıyor...");
      response = await sendUSDC(to, action.amount);
      if (isSuccessfulResponse(response)) {
        recordSuccessfulTransaction({
          kind: "send",
          amountUSDC: Number.isFinite(amount) ? amount : undefined,
          recipient: to,
        });
        logPolicyTrace({
          decision: "allow",
          requestedType: "send",
          requestedAction,
          guardCode: guard.code,
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          executedAction: describeExecutedAction("send", { amount: action.amount, to }),
          executionTxHash: extractTxHash(response) ?? undefined,
          details: { recipient: to, usage: getGuardUsageSummary() },
        });
      } else {
        logPolicyTrace({
          decision: "deny",
          requestedType: "send",
          requestedAction,
          guardCode: "execution_failed",
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          denyReason: response,
          details: { recipient: to },
        });
      }
      if (msg) {
        await session.edit(msg, response, { markdown: true });
      } else {
        await session.reply(response, { markdown: true });
      }
      break;
    }
    case "balance": {
      const address = action.address || getWalletAddress();
      response = await checkBalance(address);
      await session.reply(response, { markdown: true });
      break;
    }
    case "chain_balance": {
      const address = await resolveTargetAddress(session, action.address);
      response = await getChainBalance(address, action.chain);
      await session.reply(response, { markdown: true });
      break;
    }
    case "price": {
      const msg = await session.reply("⏳ Fiyat alınıyor...");
      response = await getETHPrice();
      if (msg) {
        await session.edit(msg, response, { markdown: true });
      } else {
        await session.reply(response, { markdown: true });
      }
      break;
    }
    case "portfolio": {
      const address = await resolveTargetAddress(session, action.address);
      response = await getPortfolio(address);
      await session.reply(response, { markdown: true });
      break;
    }
    case "positions": {
      const address = await resolveTargetAddress(session, action.address);
      response = await getPositions(address);
      await session.reply(response, { markdown: true });
      break;
    }
    case "tx_history": {
      const address = await resolveTargetAddress(session, action.address);
      response = await getTransactionHistory(address);
      await session.reply(response, { markdown: true });
      break;
    }
    case "wallet_score": {
      const address = await resolveTargetAddress(session, action.address);
      response = await scoreWallet(address);
      await session.reply(response, { markdown: true });
      break;
    }
    case "wallet_patterns": {
      const address = await resolveTargetAddress(session, action.address);
      response = await getWalletPatterns(address);
      await session.reply(response, { markdown: true });
      break;
    }
    case "research_query": {
      const msg = await session.reply("⏳ Paid research capability çağrılıyor...");
      try {
        response = await buyMarketResearch(action.query).catch((err: any) =>
          `❌ Research capability çağrısı başarısız: ${err?.message?.slice(0, 120) || "Unknown error"}`
        );
      } catch (err: any) {
        response = `❌ Research capability çağrısı başarısız: ${err?.message?.slice(0, 160) || "Unknown error"}`;
      }
      if (msg) {
        await session.edit(msg, response);
      } else {
        await session.reply(response);
      }
      break;
    }
    case "bridge": {
      const amount = Number.parseFloat(action.amount);
      const amountUSDC = action.fromToken.toUpperCase() === "USDC" && Number.isFinite(amount) ? amount : undefined;
      const requestedAction = describeRequestedAction("bridge", {
        amount: action.amount,
        fromToken: action.fromToken,
        fromChain: action.fromChain,
        toChain: action.toChain,
      });
      const confirmation = requireHighValueConfirmation(actorKey ?? undefined, action, amountUSDC);
      if (!confirmation.ok) {
        response = confirmation.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "bridge",
          requestedAction,
          guardCode: confirmation.code,
          matchedRules: confirmation.matchedRules,
          denyReason: confirmation.message,
          details: confirmation.details,
        });
        await session.reply(response, { markdown: true });
        break;
      }
      const guard = enforceTransactionGuards({
        kind: "bridge",
        amountUSDC,
      });
      if (!guard.ok) {
        response = guard.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "bridge",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          denyReason: guard.message,
          details: guard.details,
        });
        await session.reply(response, { markdown: true });
        break;
      }
      const msg = await session.reply(`⏳ Li.Fi route bulunuyor (${action.fromChain} → ${action.toChain})...`);
      response = await bridge(action.fromChain, action.toChain, action.fromToken, action.amount, action.toToken);
      if (isSuccessfulResponse(response)) {
        recordSuccessfulTransaction({
          kind: "bridge",
          amountUSDC,
        });
        logPolicyTrace({
          decision: "allow",
          requestedType: "bridge",
          requestedAction,
          guardCode: guard.code,
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          executedAction: describeExecutedAction("bridge", {
            amount: action.amount,
            fromToken: action.fromToken,
            fromChain: action.fromChain,
            toChain: action.toChain,
          }),
          executionTxHash: extractTxHash(response) ?? undefined,
        });
      } else {
        logPolicyTrace({
          decision: "deny",
          requestedType: "bridge",
          requestedAction,
          guardCode: "execution_failed",
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          denyReason: response,
        });
      }
      if (msg) {
        await session.edit(msg, response, { markdown: true });
      } else {
        await session.reply(response, { markdown: true });
      }
      break;
    }
    case "token_search": {
      if (session.typing) await session.typing();
      response = await searchToken(action.query, action.chain);
      await session.reply(response, { markdown: true });
      break;
    }
    case "spending_summary": {
      if (!actorKey) {
        response = "❌ Kullanıcı bilgisi alınamadı.";
        await session.reply(response);
        break;
      }
      if (session.typing) await session.typing();
      response = await getSpendingSummaryForActor(actorKey);
      await session.reply(`📊 *Harcama Geçmişin*\n\n${response}`, { markdown: true });
      break;
    }
    case "help": {
      response =
        "Lexon is now being refactored for XMTP coordination and a private dashboard. " +
        "Use clear requests for transfers, swaps, bridges, portfolio, wallet analysis, or paid research.";
      await session.reply(response);
      break;
    }
    case "swap_eth_usdc": {
      const requestedAction = describeRequestedAction("swap", {
        amount: action.amount,
        fromToken: "ETH",
        toToken: "USDC",
      });
      const guard = enforceTransactionGuards({ kind: "swap" });
      if (!guard.ok) {
        response = guard.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          denyReason: guard.message,
          details: guard.details,
        });
        await session.reply(response, { markdown: true });
        break;
      }
      const msg = await session.reply("⏳ ETH → USDC swap...");
      response = await swapETHtoUSDC(action.amount, action.dex);
      if (isSuccessfulResponse(response)) {
        recordSuccessfulTransaction({ kind: "swap" });
        logPolicyTrace({
          decision: "allow",
          requestedType: "swap",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          executedAction: describeExecutedAction("swap", { amount: action.amount, fromToken: "ETH", toToken: "USDC" }),
          executionTxHash: extractTxHash(response) ?? undefined,
        });
      } else {
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: "execution_failed",
          matchedRules: guard.matchedRules,
          denyReason: response,
        });
      }
      if (msg) {
        await session.edit(msg, response, { markdown: true });
      } else {
        await session.reply(response, { markdown: true });
      }
      break;
    }
    case "swap_usdc_eth": {
      const amount = Number.parseFloat(action.amount);
      const requestedAction = describeRequestedAction("swap", {
        amount: action.amount,
        fromToken: "USDC",
        toToken: "ETH",
      });
      const confirmation = requireHighValueConfirmation(
        actorKey ?? undefined,
        action,
        Number.isFinite(amount) ? amount : undefined
      );
      if (!confirmation.ok) {
        response = confirmation.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: confirmation.code,
          matchedRules: confirmation.matchedRules,
          denyReason: confirmation.message,
          details: confirmation.details,
        });
        await session.reply(response, { markdown: true });
        break;
      }
      const guard = enforceTransactionGuards({
        kind: "swap",
        amountUSDC: Number.isFinite(amount) ? amount : undefined,
      });
      if (!guard.ok) {
        response = guard.message;
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: guard.code,
          matchedRules: guard.matchedRules,
          denyReason: guard.message,
          details: guard.details,
        });
        await session.reply(response, { markdown: true });
        break;
      }
      const msg = await session.reply("⏳ USDC → ETH swap...");
      response = await swapUSDCtoETH(action.amount, action.dex);
      if (isSuccessfulResponse(response)) {
        recordSuccessfulTransaction({
          kind: "swap",
          amountUSDC: Number.isFinite(amount) ? amount : undefined,
        });
        logPolicyTrace({
          decision: "allow",
          requestedType: "swap",
          requestedAction,
          guardCode: guard.code,
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          executedAction: describeExecutedAction("swap", { amount: action.amount, fromToken: "USDC", toToken: "ETH" }),
          executionTxHash: extractTxHash(response) ?? undefined,
        });
      } else {
        logPolicyTrace({
          decision: "deny",
          requestedType: "swap",
          requestedAction,
          guardCode: "execution_failed",
          matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
          denyReason: response,
        });
      }
      if (msg) {
        await session.edit(msg, response, { markdown: true });
      } else {
        await session.reply(response, { markdown: true });
      }
      break;
    }
    case "unknown": {
      response = await generateChatReply(text, userContext);
      await session.reply(response, { markdown: true });
      break;
    }
  }

  if (actorKey && text && response) {
    await logInteractionForActor(actorKey, text, response);
  }

  return response;
}
