import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme as ExactEvmClientScheme } from "@x402/evm/exact/client";
import type { ClientEvmSigner } from "@x402/evm";

import { publicClient } from "../base";
import { config } from "../config";
import { getWalletAddress, owsSignTypedData } from "../wallet";
import { X402_BASE_NETWORK } from "./config";

let cachedFetchWithPayment: typeof fetch | null = null;

function stringifyTypedData(value: unknown): string {
  return JSON.stringify(value, (_key, entry) =>
    typeof entry === "bigint" ? entry.toString() : entry
  );
}

function getOwsX402Signer(): ClientEvmSigner {
  return {
    address: getWalletAddress() as `0x${string}`,
    signTypedData: async (typedData) =>
      owsSignTypedData(stringifyTypedData(typedData)) as `0x${string}`,
    readContract: async (args) => publicClient.readContract(args as Parameters<typeof publicClient.readContract>[0]),
    getTransactionCount: async ({ address }) => publicClient.getTransactionCount({ address }),
    estimateFeesPerGas: async () => {
      const fees = await publicClient.estimateFeesPerGas();
      return {
        maxFeePerGas: fees.maxFeePerGas ?? fees.gasPrice ?? 0n,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas ?? 0n,
      };
    },
  };
}

export function getX402Fetch(): typeof fetch {
  if (cachedFetchWithPayment) return cachedFetchWithPayment;
  cachedFetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: X402_BASE_NETWORK,
        client: new ExactEvmClientScheme(getOwsX402Signer(), {
          8453: { rpcUrl: config.rpcUrl },
        }),
      },
    ],
  });

  return cachedFetchWithPayment;
}
