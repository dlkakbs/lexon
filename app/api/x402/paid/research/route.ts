import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { createPaidRouteConfig, getX402Server } from "@/lib/x402/server";

export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function buildMockResearch(query: string) {
  const q = query.toLowerCase();

  if (q.includes("stablecoin") && q.includes("base")) {
    return {
      title: "Base Stablecoin Activity",
      summary:
        "Base stablecoin activity remains strong, with USDC acting as the default settlement asset for swaps, bridging, and agent payments. For Lexon-style flows, the main focus is route quality, bridge availability, and wallet policy constraints rather than broad market timing.",
      highlights: [
        "USDC is the primary operational asset for Base-native agent flows.",
        "Bridge decisions should be evaluated alongside policy limits and recipient constraints.",
        "Short-form research is better used as execution context than as autonomous trading advice.",
      ],
    };
  }

  if (q.includes("arbitrum") && q.includes("base")) {
    return {
      title: "Base vs Arbitrum Brief",
      summary:
        "Base is usually the more natural execution environment for Lexon because wallet policy, swap, and bridge flows are configured around Base first. Arbitrum is relevant as a destination or comparison chain, but the agent should prefer the chain with the clearest route, sufficient liquidity, and policy approval.",
      highlights: [
        "Base is the primary execution chain in Lexon.",
        "Arbitrum is best treated as a destination or comparison target.",
        "The correct choice depends on route, fees, and policy constraints.",
      ],
    };
  }

  return {
    title: "Market Research Brief",
    summary: `Research summary for: ${query}`,
    highlights: [
      "Use this endpoint as a paid external research capability.",
      "For production use, replace this mock summary with a real research backend.",
      "Lexon can buy this capability over x402 from any compatible endpoint.",
    ],
  };
}

const handler = async (request: NextRequest): Promise<NextResponse<any>> => {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return badRequest("Missing q");

  return NextResponse.json({
    capability: "research",
    ok: true,
    query,
    ...buildMockResearch(query),
  });
};

const paidGet = withX402(
  handler,
  createPaidRouteConfig("Lexon paid market research"),
  getX402Server(),
  undefined,
  undefined,
  false,
);

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return handler(request);
  }

  return paidGet(request);
}
