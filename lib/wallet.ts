import {
  createWallet,
  listWallets,
  createPolicy,
  listPolicies,
  signAndSend,
  signTransaction,
  type WalletInfo,
} from "@open-wallet-standard/core";

const WALLET_NAME = process.env.OWS_WALLET_NAME || "lexon-wallet";
const BASE_RPC = process.env.BASE_RPC_URL || "https://mainnet.base.org";

// OWS policy: Base mainnet only + expiry (spending limits enforced in app layer)
const POLICY_JSON = JSON.stringify({
  id: "lexon-base-policy",
  name: "Lexon Base Policy",
  version: 1,
  action: "deny",
  created_at: new Date().toISOString(),
  rules: [
    { type: "allowed_chains", chain_ids: ["eip155:8453"] },
    { type: "expires_at", timestamp: "2026-05-01T00:00:00Z" },
  ],
});

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
