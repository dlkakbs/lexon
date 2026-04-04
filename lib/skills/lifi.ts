/**
 * Li.Fi cross-chain bridge skill.
 * Gets a route quote → OWS approves USDC → OWS signs bridge tx.
 * No API key required (rate-limited). Set LIFI_API_KEY for higher limits.
 * Docs: https://docs.li.fi
 */

import { encodeFunctionData, parseUnits, serializeTransaction } from "viem";
import { publicClient } from "../base";
import { getWalletAddress, owsSignAndSend } from "../wallet";
import { approveContract, isApprovedContract } from "../contracts";
import { config } from "../config";
import { enforceTransactionGuards, requireHighValueConfirmation } from "../guards";

const LIFI_API = "https://li.quest/v1";

// Native token address (ETH/MATIC/BNB etc.) — Li.Fi standardı
const NATIVE = "0x0000000000000000000000000000000000000000";

// Human-readable chain name → Li.Fi chain ID
const CHAIN_IDS: Record<string, number> = {
  base:      8453,
  ethereum:  1,
  eth:       1,
  polygon:   137,
  matic:     137,
  arbitrum:  42161,
  arb:       42161,
  optimism:  10,
  op:        10,
  bnb:       56,
  bsc:       56,
  avalanche: 43114,
  avax:      43114,
  zksync:    324,
  "zksync-era": 324,
  linea:     59144,
  scroll:    534352,
  blast:     81457,
  mantle:    5000,
  mode:      34443,
  unichain:  130,
  sonic:     146,
  berachain: 80094,
  gnosis:    100,
  celo:      42220,
};

// Native token sembolleri — bunlar için adres aramaya gerek yok
const NATIVE_SYMBOLS = new Set(["ETH", "MATIC", "BNB", "AVAX", "OP", "ARB", "FTM", "ONE"]);

// USDC Base adresi (approve kontrolü için)
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

function tokenDecimals(symbol: string): number {
  return symbol.toUpperCase() === "USDC" ? 6 : 18;
}

// Li.Fi sembol veya adres kabul eder — native token için NATIVE sabitini kullan
function tokenParam(symbol: string): string {
  const upper = symbol.toUpperCase();
  return NATIVE_SYMBOLS.has(upper) ? NATIVE : upper; // sembol olarak geç, Li.Fi çözer
}

function isNativeSymbol(symbol: string): boolean {
  return NATIVE_SYMBOLS.has(symbol.toUpperCase());
}

const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;


function lifiHeaders(): Record<string, string> {
  const key = process.env.LIFI_API_KEY;
  return key ? { "x-lifi-api-key": key } : {};
}

function resolveChainId(name: string): number | null {
  const n = parseInt(name);
  if (!isNaN(n)) return n;
  return CHAIN_IDS[name.toLowerCase()] ?? null;
}

async function getQuote(
  fromChainId: number,
  toChainId: number,
  fromToken: string,
  toToken: string,
  fromAmount: string, // in smallest unit (e.g. 5000000 for 5 USDC)
  fromAddress: string,
): Promise<any> {
  const url = new URL(`${LIFI_API}/quote`);
  url.searchParams.set("fromChain",   fromChainId.toString());
  url.searchParams.set("toChain",     toChainId.toString());
  url.searchParams.set("fromToken",   fromToken);
  url.searchParams.set("toToken",     toToken);
  url.searchParams.set("fromAmount",  fromAmount);
  url.searchParams.set("fromAddress", fromAddress);

  const res = await fetch(url.toString(), { headers: lifiHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Li.Fi API error: ${res.status}`);
  }
  return res.json();
}

export type BridgeEvaluationResult =
  | {
      ok: true;
      requestedAction: string;
      decision: "allow";
      matchedRules: string[];
      confirmationRequired: boolean;
      route: {
        tool: string;
        toAmountMin: string;
        toToken: string;
        feeUsd: string;
      };
      wouldExecute: {
        fromChain: string;
        toChain: string;
        fromToken: string;
        toToken: string;
        amount: string;
      };
    }
  | {
      ok: false;
      requestedAction: string;
      decision: "deny";
      matchedRules: string[];
      reason: string;
      code?: string;
      details?: Record<string, unknown>;
    };

function requestedBridgeAction(fromChain: string, toChain: string, fromToken: string, amount: string, toToken?: string) {
  return `bridge ${amount} ${fromToken.toUpperCase()} from ${fromChain} to ${toChain}${toToken ? ` as ${toToken.toUpperCase()}` : ""}`;
}

export async function evaluateBridge(
  fromChain: string,
  toChain: string,
  fromToken: string,
  amount: string,
  toToken?: string,
  userId?: number,
): Promise<BridgeEvaluationResult> {
  const requestedAction = requestedBridgeAction(fromChain, toChain, fromToken, amount, toToken);
  const fromChainId = resolveChainId(fromChain);
  const toChainId = resolveChainId(toChain);

  if (!fromChainId) {
    return {
      ok: false,
      decision: "deny",
      requestedAction,
      matchedRules: ["allowed_chains"],
      reason: `Unknown source chain: ${fromChain}`,
      code: "unknown_source_chain",
    };
  }

  if (!toChainId) {
    return {
      ok: false,
      decision: "deny",
      requestedAction,
      matchedRules: ["allowed_chains"],
      reason: `Unknown destination chain: ${toChain}`,
      code: "unknown_destination_chain",
    };
  }

  if (fromChainId !== 8453) {
    return {
      ok: false,
      decision: "deny",
      requestedAction,
      matchedRules: ["allowed_chains"],
      reason: "Only Base is supported as the source chain.",
      code: "source_chain_not_supported",
    };
  }

  const destinationCaip = `eip155:${toChainId}`;
  if (!config.allowedChainIds.includes(destinationCaip)) {
    return {
      ok: false,
      decision: "deny",
      requestedAction,
      matchedRules: ["allowed_chains"],
      reason: `Destination chain is not allowed by the current policy: ${destinationCaip}`,
      code: "destination_chain_not_allowed",
    };
  }

  const amountNum = parseFloat(amount);
  const amountUSDC = fromToken.toUpperCase() === "USDC" && Number.isFinite(amountNum) ? amountNum : undefined;
  const action = {
    type: "bridge" as const,
    fromChain,
    toChain,
    fromToken,
    amount,
    toToken,
  };

  const confirmation = requireHighValueConfirmation(userId, action, amountUSDC);
  if (!confirmation.ok) {
    return {
      ok: false,
      decision: "deny",
      requestedAction,
      matchedRules: confirmation.matchedRules,
      reason: confirmation.message,
      code: confirmation.code,
      details: confirmation.details,
    };
  }

  const guard = enforceTransactionGuards({
    kind: "bridge",
    amountUSDC,
  });
  if (!guard.ok) {
    return {
      ok: false,
      decision: "deny",
      requestedAction,
      matchedRules: guard.matchedRules,
      reason: guard.message,
      code: guard.code,
      details: guard.details,
    };
  }

  const fromSymbol = fromToken.toUpperCase();
  const toSymbol = (toToken ?? fromToken).toUpperCase();
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return {
      ok: false,
      decision: "deny",
      requestedAction,
      matchedRules: [...confirmation.matchedRules, ...guard.matchedRules],
      reason: `Invalid amount: ${amount}`,
      code: "invalid_amount",
    };
  }

  try {
    const decimals = tokenDecimals(fromSymbol);
    const fromAmountRaw = parseUnits(amount, decimals).toString();
    const fromTokenParam = tokenParam(fromSymbol);
    const toTokenParam = tokenParam(toSymbol);
    const fromAddress = getWalletAddress() as `0x${string}`;
    const quote = await getQuote(fromChainId, toChainId, fromTokenParam, toTokenParam, fromAmountRaw, fromAddress);

    const toDecimals = tokenDecimals(toSymbol);
    const toAmountMin = quote.estimate?.toAmountMin
      ? (Number(quote.estimate.toAmountMin) / 10 ** toDecimals).toFixed(toDecimals === 6 ? 2 : 6)
      : "?";
    const feeUsd = quote.estimate?.feeCosts
      ?.reduce((sum: number, f: any) => sum + parseFloat(f.amountUSD ?? "0"), 0)
      .toFixed(4) ?? "?";
    const tool = quote.toolDetails?.name ?? quote.tool ?? "Li.Fi";

    return {
      ok: true,
      decision: "allow",
      requestedAction,
      matchedRules: Array.from(new Set([...confirmation.matchedRules, ...guard.matchedRules, "allowed_chains", "expires_at"])),
      confirmationRequired: false,
      route: {
        tool,
        toAmountMin,
        toToken: toSymbol,
        feeUsd,
      },
      wouldExecute: {
        fromChain,
        toChain,
        fromToken: fromSymbol,
        toToken: toSymbol,
        amount,
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      decision: "deny",
      requestedAction,
      matchedRules: Array.from(new Set([...confirmation.matchedRules, ...guard.matchedRules, "allowed_chains", "expires_at"])),
      reason: err?.message?.slice(0, 150) || "Bridge evaluation failed",
      code: "quote_failed",
    };
  }
}


/**
 * Bridge/cross-chain swap via Li.Fi, signed by OWS wallet.
 * Supports ETH↔USDC conversions across EVM chains.
 *
 * @param fromChain   "base" | "ethereum" | "polygon" | ... (şu an sadece base)
 * @param toChain     hedef chain
 * @param fromToken   "ETH" | "USDC"
 * @param amount      human-readable (e.g. "5" or "0.01")
 * @param toToken     opsiyonel — farklı token isterse (e.g. ETH bridge → USDC on Polygon)
 */
export async function bridge(
  fromChain: string,
  toChain: string,
  fromToken: string,
  amount: string,
  toToken?: string,
): Promise<string> {
  const fromChainId = resolveChainId(fromChain);
  const toChainId   = resolveChainId(toChain);

  if (!fromChainId) return `❌ Tanımlanamayan kaynak chain: ${fromChain}`;
  if (!toChainId)   return `❌ Tanımlanamayan hedef chain: ${toChain}`;
  if (fromChainId === toChainId) return `❌ Kaynak ve hedef aynı chain. Swap için "swap" komutunu kullan.`;
  if (fromChainId !== 8453) return `❌ Şu an sadece Base'den bridge destekleniyor. OWS cüzdanın Base'de.`;

  const fromSymbol = fromToken.toUpperCase();
  const toSymbol   = (toToken ?? fromToken).toUpperCase();

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) return `❌ Geçersiz miktar: ${amount}`;

  const decimals      = tokenDecimals(fromSymbol);
  const fromAmountRaw = parseUnits(amount, decimals).toString();
  const fromTokenParam = tokenParam(fromSymbol);
  const toTokenParam   = tokenParam(toSymbol);

  const fromAddress = getWalletAddress() as `0x${string}`;

  try {
    // 1. Li.Fi'den route al
    const quote = await getQuote(fromChainId, toChainId, fromTokenParam, toTokenParam, fromAmountRaw, fromAddress);
    const txReq = quote.transactionRequest;
    if (!txReq) throw new Error("Li.Fi'den transaction verisi gelmedi.");

    const toDecimals = tokenDecimals(toSymbol);
    const toAmountMin = quote.estimate?.toAmountMin
      ? (Number(quote.estimate.toAmountMin) / 10 ** toDecimals).toFixed(toDecimals === 6 ? 2 : 6)
      : "?";
    const fee = quote.estimate?.feeCosts
      ?.reduce((sum: number, f: any) => sum + parseFloat(f.amountUSD ?? "0"), 0)
      .toFixed(4) ?? "?";
    const bridge = quote.toolDetails?.name ?? quote.tool ?? "Li.Fi";

    // 2. ERC20 ise approve (native token'lar için gerek yok)
    if (!isNativeSymbol(fromSymbol)) {
      const approvalAddress = quote.estimate?.approvalAddress;
      if (approvalAddress) {
        // Approve etmemiz gereken token adresi — Li.Fi'den dönen fromToken adresini kullan
        const actualFromToken = (quote.action?.fromToken?.address ?? USDC_BASE) as `0x${string}`;
        const approveTarget   = actualFromToken as `0x${string}`;
        // ensureApproval USDC_ADDRESS hardcoded, bu versiyonda actual adresi kullan
        const data = encodeFunctionData({
          abi: ERC20_APPROVE_ABI,
          functionName: "approve",
          args: [approvalAddress as `0x${string}`, BigInt(fromAmountRaw)],
        });
        const [nonce, gasPrice] = await Promise.all([
          publicClient.getTransactionCount({ address: fromAddress }),
          publicClient.getGasPrice(),
        ]);
        const gas = await publicClient.estimateGas({ account: fromAddress, to: approveTarget, data });
        const approveTxHex = serializeTransaction({ chainId: fromChainId, to: approveTarget, data, nonce, gasPrice, gas, value: 0n });
        const approveTxHash = owsSignAndSend(approveTxHex);
        await publicClient.waitForTransactionReceipt({ hash: approveTxHash as `0x${string}` });
      }
    }

    // 3. Bridge tx'i OWS ile imzala
    // Li.Fi farklı route'larda farklı contract adresleri döndürebilir.
    // OWS executable contract allowlist'i kontrol ettiğinden, Li.Fi'den dönen
    // to adresini dinamik olarak data/contracts.json'a ekle.
    if (txReq.to && !isApprovedContract(txReq.to)) {
      approveContract(txReq.to, `Li.Fi route (${bridge})`);
    }

    const nonce = await publicClient.getTransactionCount({ address: fromAddress });
    const txHex = serializeTransaction({
      chainId:  fromChainId,
      to:       txReq.to as `0x${string}`,
      data:     txReq.data as `0x${string}`,
      value:    BigInt(txReq.value ?? "0x0"),
      gasPrice: BigInt(txReq.gasPrice),
      gas:      BigInt(txReq.gasLimit),
      nonce,
    });

    const txHash = owsSignAndSend(txHex);
    const toChainLabel = toChain.charAt(0).toUpperCase() + toChain.slice(1);

    const conversion = fromSymbol !== toSymbol ? ` → ${toSymbol}` : "";

    return (
      `✅ *Bridge başlatıldı!*\n\n` +
      `📤 ${amount} ${fromSymbol}${conversion} · Base → ${toChainLabel}\n` +
      `📥 ~${toAmountMin} ${toSymbol} alacaksın\n` +
      `🌉 Protokol: ${bridge}\n` +
      `💸 Fee: ~$${fee}\n\n` +
      `🔗 [Basescan'de görüntüle](https://basescan.org/tx/${txHash})\n` +
      `_Genellikle 1-5 dakika sürer._`
    );
  } catch (err: any) {
    return `❌ Bridge başarısız: ${err?.message?.slice(0, 150)}`;
  }
}
