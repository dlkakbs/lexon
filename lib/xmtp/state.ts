import fs from "fs";
import path from "path";

import { getWalletAddress } from "../wallet";
import { xmtpConfig } from "./config";
import type { LexonGroupMessage } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const XMTP_STATE_PATH = path.join(DATA_DIR, "xmtp-state.json");

export type JoinRequestStatus = "pending" | "approved" | "rejected";

export type JoinRequest = {
  id: string;
  actorId: string;
  actorType: "lexon" | "user";
  note: string;
  status: JoinRequestStatus;
  createdAt: string;
};

type XmtpState = {
  group: {
    id: string;
    inviteId: string;
    creatorWallet: string;
    createdAt: string;
  };
  messages: LexonGroupMessage[];
  joinRequests: JoinRequest[];
};

function createInitialState(): XmtpState {
  const now = new Date().toISOString();
  return {
    group: {
      id: xmtpConfig.groupId || "lexon-coordination-room",
      inviteId: "lexon-main-invite",
      creatorWallet: getWalletAddress(),
      createdAt: now,
    },
    messages: [
      {
        type: "chat_basic",
        sender: "lexon",
        summary: "Private coordination room initialized.",
      },
      {
        type: "capability_offer",
        sender: "lexon",
        summary: "Bridge evaluation capability available over x402.",
        capability: "evaluate_bridge",
        priceUsd: "0.01",
        endpoint: "/api/x402/paid/evaluate-bridge",
      },
    ],
    joinRequests: [],
  };
}

function ensureState(): XmtpState {
  try {
    if (!fs.existsSync(XMTP_STATE_PATH)) return createInitialState();
    const parsed = JSON.parse(fs.readFileSync(XMTP_STATE_PATH, "utf-8")) as Partial<XmtpState>;
    const base = createInitialState();
    return {
      group: parsed.group ?? base.group,
      messages: parsed.messages ?? base.messages,
      joinRequests: parsed.joinRequests ?? base.joinRequests,
    };
  } catch {
    return createInitialState();
  }
}

function saveState(state: XmtpState) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(XMTP_STATE_PATH, JSON.stringify(state, null, 2));
}

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getXmtpState(): XmtpState {
  const state = ensureState();
  saveState(state);
  return state;
}

export function setXmtpGroup(input: { id: string; inviteId?: string }) {
  const state = ensureState();
  state.group.id = input.id;
  if (input.inviteId) state.group.inviteId = input.inviteId;
  saveState(state);
  return state.group;
}

export function createJoinRequest(input: {
  actorId: string;
  actorType: "lexon" | "user";
  note?: string;
}): JoinRequest {
  const state = ensureState();
  const request: JoinRequest = {
    id: createId("join"),
    actorId: input.actorId,
    actorType: input.actorType,
    note: input.note?.trim() || "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  state.joinRequests.unshift(request);
  saveState(state);
  return request;
}

export function updateJoinRequestStatus(id: string, status: JoinRequestStatus): JoinRequest | null {
  const state = ensureState();
  const request = state.joinRequests.find((item) => item.id === id);
  if (!request) return null;
  request.status = status;
  saveState(state);
  return request;
}

export function appendGroupMessage(message: LexonGroupMessage): LexonGroupMessage {
  const state = ensureState();
  state.messages.unshift(message);
  state.messages = state.messages.slice(0, 50);
  saveState(state);
  return message;
}
