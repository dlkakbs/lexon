import { appendGroupMessage, setXmtpGroup } from "./state";
import { getXmtpMissingConfig, isXmtpConfigured, xmtpConfig } from "./config";

type XmtpAgentModule = typeof import("@xmtp/agent-sdk");
type XmtpAgentInstance = Awaited<ReturnType<XmtpAgentModule["Agent"]["createFromEnv"]>>;

let agentPromise: Promise<XmtpAgentInstance> | null = null;
let started = false;
let lastError: string | null = null;

async function loadModule(): Promise<XmtpAgentModule> {
  return import("@xmtp/agent-sdk");
}

async function createAgent(): Promise<XmtpAgentInstance> {
  const { Agent } = await loadModule();
  return Agent.createFromEnv({
    env: xmtpConfig.env,
    dbPath: xmtpConfig.dbPath,
  });
}

function wireAgent(agent: XmtpAgentInstance) {
  if (started) return;

  agent.on("text", async (ctx) => {
    appendGroupMessage({
      type: "chat_basic",
      sender: ctx.message.senderInboxId || "unknown",
      summary: String(ctx.message.content || "").slice(0, 240),
    });
  });

  agent.on("group", async (ctx) => {
    appendGroupMessage({
      type: "chat_basic",
      sender: "system",
      summary: `Joined group conversation ${ctx.conversation.id}`,
    });
  });
}

export async function getXmtpAgent(): Promise<XmtpAgentInstance> {
  if (!isXmtpConfigured()) {
    throw new Error(`Missing XMTP config: ${getXmtpMissingConfig().join(", ")}`);
  }

  if (!agentPromise) {
    agentPromise = createAgent();
  }

  return agentPromise;
}

export async function startXmtpAgent(): Promise<void> {
  try {
    const agent = await getXmtpAgent();
    wireAgent(agent);

    if (!started) {
      await agent.start();
      started = true;
      lastError = null;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown XMTP bootstrap error";
    lastError = message;
    throw error;
  }
}

export function getXmtpAgentStatus() {
  return {
    configured: isXmtpConfigured(),
    missing: getXmtpMissingConfig(),
    started,
    lastError,
    env: xmtpConfig.env,
    dbPath: xmtpConfig.dbPath,
  };
}

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function createXmtpGroup(memberAddresses: string[] = []) {
  const agent = await getXmtpAgent();
  const addresses = memberAddresses.filter(isAddress);
  const group = await agent.createGroupWithAddresses(addresses);
  const inviteId = `invite_${group.id.slice(0, 12)}`;
  setXmtpGroup({ id: group.id, inviteId });
  appendGroupMessage({
    type: "chat_basic",
    sender: "system",
    summary: `XMTP group created: ${group.id}`,
  });
  return { groupId: group.id, inviteId };
}

export async function addXmtpGroupMember(groupId: string, address: string) {
  if (!isAddress(address)) {
    throw new Error("actorId must be a valid EVM address to add as an XMTP member");
  }

  const agent = await getXmtpAgent();
  const context = await agent.getConversationContext(groupId);
  if (!context?.isGroup()) {
    throw new Error("XMTP group not found");
  }

  await agent.addMembersWithAddresses(context.conversation, [address]);
  appendGroupMessage({
    type: "chat_basic",
    sender: "system",
    summary: `Added member ${address} to XMTP group.`,
  });
}
