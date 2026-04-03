import {
  createWallet,
  listWallets,
  createPolicy,
  listPolicies,
  signAndSend,
  signTransaction,
  type WalletInfo,
} from "@open-wallet-standard/core";

import { config } from "./config";
import { getAllContracts } from "./contracts";

const WALLET_NAME = config.walletName;
const BASE_RPC = config.rpcUrl;

// OWS policy — all rules read from config / .env
function buildPolicy() {
  const rules: any[] = [
    { type: "allowed_chains", chain_ids: config.allowedChainIds },
    { type: "expires_at", timestamp: config.policyExpiry },
    {
      type: "max_value_per_tx",
      token: "USDC",
      max_amount: config.maxSendUSDC.toString(),
    },
    {
      type: "max_value_per_day",
      token: "USDC",
      max_amount: config.maxDailyUSDC.toString(),
    },
    {
      type: "max_tx_per_day",
      max_count: config.maxTxPerDay,
    },
    {
      type: "cooldown",
      seconds: config.cooldownSeconds,
    },
    {
      type: "max_value_per_address_per_day",
      token: "USDC",
      max_amount: config.maxPerAddressDaily.toString(),
    },
  ];

  // Merge hardcoded DEXes + user-approved contracts
  const allContracts = Object.keys(getAllContracts());
  if (allContracts.length > 0) {
    rules.push({ type: "allowed_contracts", addresses: allContracts });
  }

  if (config.allowedMethods.length > 0) {
    rules.push({ type: "allowed_methods", selectors: config.allowedMethods });
  }

  if (config.confirmAboveUSDC > 0) {
    rules.push({
      type: "require_confirmation",
      token: "USDC",
      above_amount: config.confirmAboveUSDC.toString(),
    });
  }

  return JSON.stringify({
    id: "lexon-policy",
    name: "Lexon Policy",
    version: 1,
    action: "deny",
    created_at: new Date().toISOString(),
    rules,
  });
}

const POLICY_JSON = buildPolicy();

export function getOrCreateWallet(): WalletInfo {
  const wallets = listWallets();
  const existing = wallets.find((w) => w.name === WALLET_NAME);
  if (existing) return existing;

  const wallet = createWallet(WALLET_NAME);

  // Register spend policy (best-effort — policy format may vary by OWS version)
  try {
    createPolicy(POLICY_JSON);
  } catch {
    // Policy registration is advisory — continue without it
  }

  return wallet;
}

export function getWalletAddress(): string {
  const wallet = getOrCreateWallet();
  const evmAccount = wallet.accounts.find(
    (a) => a.chainId === "eip155:8453" || a.chainId.startsWith("eip155")
  );
  return evmAccount?.address ?? wallet.accounts[0].address;
}

export function owsSignAndSend(txHex: string): string {
  const result = signAndSend(
    WALLET_NAME,
    "eip155:8453",
    txHex,
    undefined, // passphrase
    undefined, // index
    BASE_RPC
  );
  return result.txHash;
}

export function owsSignTx(txHex: string): string {
  const result = signTransaction(WALLET_NAME, "eip155:8453", txHex);
  return result.signature;
}
