export type LexonGroupMessageType =
  | "chat_basic"
  | "capability_offer"
  | "capability_request"
  | "capability_result"
  | "execution_blocked"
  | "execution_complete";

export type LexonGroupMessage = {
  type: LexonGroupMessageType;
  sender: string;
  summary: string;
  capability?: string;
  priceUsd?: string;
  endpoint?: string;
  details?: Record<string, string | number | boolean | null>;
};

export const XMTP_MESSAGE_TYPES: LexonGroupMessageType[] = [
  "chat_basic",
  "capability_offer",
  "capability_request",
  "capability_result",
  "execution_blocked",
  "execution_complete",
];
