import { NextResponse } from "next/server";

import { createXmtpGroup, getXmtpAgentStatus } from "@/lib/xmtp/agent";
import { getXmtpState } from "@/lib/xmtp/state";

export async function GET() {
  return NextResponse.json({
    state: getXmtpState(),
    agent: getXmtpAgentStatus(),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const members = Array.isArray(body?.members)
    ? body.members.filter((value: unknown): value is string => typeof value === "string")
    : [];

  try {
    const result = await createXmtpGroup(members);
    return NextResponse.json({ ok: true, ...result, state: getXmtpState() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to create XMTP group",
        state: getXmtpState(),
        agent: getXmtpAgentStatus(),
      },
      { status: 500 }
    );
  }
}
