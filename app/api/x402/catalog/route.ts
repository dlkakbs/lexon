import { NextResponse } from "next/server";

import { getWalletAddress } from "@/lib/wallet";
import { getX402DefaultPrice } from "@/lib/x402/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    agent: "lexon",
    wallet: getWalletAddress(),
    x402: {
      network: "eip155:8453",
      defaultPrice: getX402DefaultPrice(),
      mode: "wallet-operator-capabilities",
    },
    capabilities: [
      {
        id: "evaluate_bridge",
        status: "live",
        route: "/api/x402/paid/evaluate-bridge",
        price: getX402DefaultPrice(),
        description: "Paid bridge preflight with policy and route evaluation",
        inputs: ["fromChain", "toChain", "fromToken", "amount", "toToken?"],
        returns: ["allow_or_deny", "matched_rules", "route", "fee", "would_execute"],
        example:
          "/api/x402/paid/evaluate-bridge?fromChain=base&toChain=arbitrum&fromToken=USDC&amount=10",
      },
      {
        id: "research",
        status: "live",
        route: "/api/x402/paid/research",
        price: getX402DefaultPrice(),
        description: "Paid market research brief for agents",
        inputs: ["q"],
        returns: ["title", "summary", "highlights"],
        example:
          "/api/x402/paid/research?q=base%20stablecoin%20activity%20this%20week",
      },
    ],
  });
}
