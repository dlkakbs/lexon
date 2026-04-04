import { NextResponse } from "next/server";

import { addXmtpGroupMember, getXmtpAgentStatus } from "@/lib/xmtp/agent";
import { createJoinRequest, updateJoinRequestStatus } from "@/lib/xmtp/state";
import { getXmtpState } from "@/lib/xmtp/state";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (body.action === "approve" || body.action === "reject") {
    if (!body?.requestId) {
      return NextResponse.json({ ok: false, error: "requestId is required" }, { status: 400 });
    }

    const updated = updateJoinRequestStatus(
      body.requestId,
      body.action === "approve" ? "approved" : "rejected"
    );

    if (!updated) {
      return NextResponse.json({ ok: false, error: "request not found" }, { status: 404 });
    }

    if (body.action === "approve") {
      try {
        const state = getXmtpState();
        await addXmtpGroupMember(state.group.id, updated.actorId);
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            error: error instanceof Error ? error.message : "Unable to add XMTP member",
            request: updated,
            agent: getXmtpAgentStatus(),
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, request: updated, agent: getXmtpAgentStatus() });
  }

  if (!body?.actorId || !body?.actorType) {
    return NextResponse.json(
      { ok: false, error: "actorId and actorType are required" },
      { status: 400 }
    );
  }

  const request = createJoinRequest({
    actorId: String(body.actorId),
    actorType: body.actorType === "lexon" ? "lexon" : "user",
    note: typeof body.note === "string" ? body.note : "",
  });

  return NextResponse.json({ ok: true, request }, { status: 201 });
}
