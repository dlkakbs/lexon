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

// Policy JSON for OWS — max $2/tx, $10/day on Base only
const POLICY_JSON = JSON.stringify({
  name: "lexon-policy",
  rules: [
    { type: "max_amount_per_tx", value: "2000000" },   // 2 USDC (6 decimals)
    { type: "daily_limit",       value: "10000000" },  // 10 USDC
    { type: "chain_allowlist",   value: ["eip155:8453"] },
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
