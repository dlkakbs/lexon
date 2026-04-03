import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { createPaidRouteConfig, getX402Server } from "@/lib/x402/server";

export const dynamic = "force-dynamic";

const handler = async (_request: NextRequest) => {
  return NextResponse.json({
    ok: true,
    capability: "capability_probe",
    message: "x402 payment settled and Lexon responded successfully.",
    next: [
      "Replace this probe with paid bridge quotes",
      "Add paid wallet intelligence reports",
      "Let other Lexon agents buy these capabilities",
    ],
  });
};

export const GET = withX402(
  handler,
  createPaidRouteConfig("Lexon paid capability probe"),
  getX402Server(),
  undefined,
  undefined,
  false,
);
