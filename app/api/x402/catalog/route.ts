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
      mode: "generic-paid-capabilities",
    },
    capabilities: [
      {
        id: "bridge_quote",
        status: "planned",
        route: "/api/x402/paid/bridge-quote",
        description: "Paid bridge pricing and route intelligence",
      },
      {
        id: "wallet_report",
        status: "planned",
        route: "/api/x402/paid/wallet-report",
        description: "Paid wallet intelligence and portfolio summary",
      },
      {
        id: "token_research",
        status: "planned",
        route: "/api/x402/paid/token-research",
        description: "Paid token and market summary",
      },
      {
        id: "capability_probe",
        status: "live",
        route: "/api/x402/paid/probe",
        description: "Minimal paid endpoint to verify x402 seller flow",
      },
    ],
  });
}

