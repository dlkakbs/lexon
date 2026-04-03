import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme as ExactEvmClientScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

import { config } from "../config";
import { X402_BASE_NETWORK } from "./config";

let cachedFetchWithPayment: typeof fetch | null = null;

export function getX402Fetch(): typeof fetch {
  if (cachedFetchWithPayment) return cachedFetchWithPayment;

  const privateKey = process.env.X402_EVM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("X402_EVM_PRIVATE_KEY is not set");
  }

  const signer = privateKeyToAccount(privateKey as `0x${string}`);
  cachedFetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: X402_BASE_NETWORK,
        client: new ExactEvmClientScheme(signer, {
          8453: { rpcUrl: config.rpcUrl },
        }),
      },
    ],
  });

  return cachedFetchWithPayment;
}

