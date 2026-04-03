import { getWalletAddress } from "../wallet";

export const X402_BASE_NETWORK = "eip155:8453" as const;

export function getX402FacilitatorUrl(): string {
  return process.env.X402_FACILITATOR_URL || "https://facilitator.x402.org";
}

export function getX402PayToAddress(): `0x${string}` {
  const explicit = process.env.X402_PAY_TO_ADDRESS;
  return (explicit || getWalletAddress()) as `0x${string}`;
}

export function getX402DefaultPrice(): string {
  return process.env.X402_DEFAULT_PRICE || "$0.01";
}

