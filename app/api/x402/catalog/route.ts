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
        id: "evaluate_bridge",
        status: "live",
        route: "/api/x402/paid/evaluate-bridge",
        description: "Paid bridge preflight with policy and route evaluation",
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
