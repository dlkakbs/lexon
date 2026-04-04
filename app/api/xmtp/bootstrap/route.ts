import { NextResponse } from "next/server";

import { getXmtpAgentStatus, startXmtpAgent } from "@/lib/xmtp/agent";

export async function GET() {
  return NextResponse.json(getXmtpAgentStatus());
}

export async function POST() {
  try {
    await startXmtpAgent();
    return NextResponse.json({ ok: true, status: getXmtpAgentStatus() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown XMTP bootstrap error",
        status: getXmtpAgentStatus(),
      },
      { status: 500 }
    );
  }
}
