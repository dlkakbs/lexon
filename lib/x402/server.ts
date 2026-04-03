import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";

import {
  getX402DefaultPrice,
  getX402FacilitatorUrl,
  getX402PayToAddress,
  X402_BASE_NETWORK,
} from "./config";

let cachedServer: x402ResourceServer | null = null;

export function getX402Server(): x402ResourceServer {
  if (cachedServer) return cachedServer;

  const facilitatorClient = new HTTPFacilitatorClient({
    url: getX402FacilitatorUrl(),
  });

  cachedServer = registerExactEvmScheme(new x402ResourceServer(facilitatorClient), {
    networks: [X402_BASE_NETWORK],
  });

  return cachedServer;
}

export function createPaidRouteConfig(description: string, price = getX402DefaultPrice()) {
  return {
    accepts: {
      scheme: "exact" as const,
      network: X402_BASE_NETWORK,
      price,
      payTo: getX402PayToAddress(),
    },
    description,
  };
}

