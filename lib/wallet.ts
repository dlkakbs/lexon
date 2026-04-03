import {
  createWallet,
  listWallets,
  createPolicy,
  deletePolicy,
  signAndSend,
  signTransaction,
  type WalletInfo,
} from "@open-wallet-standard/core";
import path from "path";

import { config } from "./config";
import { TRUSTED_CONTRACTS } from "./contracts";

const WALLET_NAME = config.walletName;
const BASE_RPC    = config.rpcUrl;
const POLICY_ID   = "lexon-policy";

/**
 * Build the OWS policy JSON.
 *
 * Declarative rules (evaluated in-process by OWS, microseconds):
 *   - allowed_chains: only sign on permitted CAIP-2 chains
 *   - expires_at:     time-bound access
 *
 * Custom executable (policy/spend_limit.js):
 *   OWS pipes the PolicyContext to it after declarative rules pass.
 *   It checks: contract allowlist, USDC per-tx, ETH per-tx, daily ETH cap.
 *   The executable reads user-approved contracts live from data/contracts.json
 *   so /approve and /unapprove work without re-registering the policy.
 *
 * policy_config is injected into PolicyContext.policy_config for the executable.
 *
 * NOTE: Policy is only enforced in agent mode (OWS_API_KEY = ows_key_...).
 *       Owner mode (empty credential) bypasses policy — never use in production.
 */
function buildPolicy(): string {
  const executablePath  = path.join(process.cwd(), "policy", "spend_limit.js");
  const contractsFile   = path.join(process.cwd(), "data", "contracts.json");

  // ETH per-tx cap in wei (from OWS_MAX_ETH_PER_TX env, default 0.05 ETH)
  const maxEthPerTxWei = String(Math.floor(config.maxEthPerTx * 1e18));

  // Daily ETH cap: mirror maxSwapUSD as a rough ETH equivalent.
  // Set conservatively — app-layer USDC daily limit is the tighter guard.
  // Users can override via OWS_MAX_DAILY_ETH env.
  const maxDailyEthDefault = parseFloat(process.env.OWS_MAX_DAILY_ETH || "0.1");
  const maxDailyEthWei     = String(Math.floor(maxDailyEthDefault * 1e18));

  return JSON.stringify({
    id:         POLICY_ID,
    name:       "Lexon Spend Guard",
    version:    1,
    action:     "deny",
    created_at: new Date().toISOString(),
    rules: [
      { type: "allowed_chains", chain_ids: config.allowedChainIds },
      { type: "expires_at",     timestamp: config.policyExpiry },
    ],
    executable: executablePath,
    config: {
      max_usdc_per_tx:    config.maxSendUSDC,
      max_eth_per_tx_wei: maxEthPerTxWei,
      max_daily_eth_wei:  maxDailyEthWei,
      // Trusted contracts are baked in at registration time.
      // User contracts are read live by the executable from contracts_file.
      trusted_contracts: Object.keys(TRUSTED_CONTRACTS),
      contracts_file:    contractsFile,
    },
  });
}

/**
 * Get or create the Lexon wallet, and (re-)register the spend policy.
 *
 * The policy is deleted and recreated on every start so the executable
 * absolute path and config values always reflect the current environment.
 */
export function getOrCreateWallet(): WalletInfo {
  const wallets  = listWallets();
  const existing = wallets.find((w) => w.name === WALLET_NAME);
  const wallet   = existing ?? createWallet(WALLET_NAME);

  // Re-register policy — ignore errors (e.g. executable not found in CI)
  try { deletePolicy(POLICY_ID); } catch {}
  try { createPolicy(buildPolicy()); } catch {}

  return wallet;
}

export function getWalletAddress(): string {
  const wallet     = getOrCreateWallet();
  const evmAccount = wallet.accounts.find(
    (a) => a.chainId === "eip155:8453" || a.chainId.startsWith("eip155")
  );
  return evmAccount?.address ?? wallet.accounts[0].address;
}

/**
 * Sign and broadcast a transaction.
 *
 * If OWS_API_KEY is set (agent mode), OWS enforces the spend policy before signing.
 * If empty (owner mode), the policy is bypassed — only use during development.
 */
export function owsSignAndSend(txHex: string): string {
  const credential = config.owsApiKey || undefined;
  const result     = signAndSend(WALLET_NAME, "eip155:8453", txHex, credential, undefined, BASE_RPC);
  return result.txHash;
}

/**
 * Sign a transaction without broadcasting (used for approve txs in bridge flow).
 */
export function owsSignTx(txHex: string): string {
  const credential = config.owsApiKey || undefined;
  const result     = signTransaction(WALLET_NAME, "eip155:8453", txHex, credential);
  return result.signature;
}
