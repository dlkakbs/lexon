import { NextResponse } from "next/server";

import { getXmtpState } from "@/lib/xmtp/state";

export async function GET() {
  return NextResponse.json(getXmtpState());
}
