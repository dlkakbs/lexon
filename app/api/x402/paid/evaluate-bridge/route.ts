import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { createPaidRouteConfig, getX402Server } from "@/lib/x402/server";
import { evaluateBridge } from "@/lib/skills/lifi";

export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

const handler = async (request: NextRequest): Promise<NextResponse<any>> => {
  const fromChain = request.nextUrl.searchParams.get("fromChain") || "base";
  const toChain = request.nextUrl.searchParams.get("toChain");
  const fromToken = request.nextUrl.searchParams.get("fromToken");
  const amount = request.nextUrl.searchParams.get("amount");
  const toToken = request.nextUrl.searchParams.get("toToken") || undefined;

  if (!toChain) return badRequest("Missing toChain");
  if (!fromToken) return badRequest("Missing fromToken");
  if (!amount) return badRequest("Missing amount");

  const result = await evaluateBridge(fromChain, toChain, fromToken, amount, toToken);
  return NextResponse.json({
    capability: "evaluate_bridge",
    ...result,
  });
};

export const GET = withX402(
  handler,
  createPaidRouteConfig("Lexon paid bridge preflight"),
  getX402Server(),
  undefined,
  undefined,
  false,
);
