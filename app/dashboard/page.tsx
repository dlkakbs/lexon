import Link from "next/link";

import { config } from "@/lib/config";
import { getXmtpMissingConfig, isXmtpConfigured, xmtpConfig } from "@/lib/xmtp/config";
import { getXmtpAgentStatus } from "@/lib/xmtp/agent";
import { XMTP_MESSAGE_TYPES } from "@/lib/xmtp/schema";
import { getXmtpState } from "@/lib/xmtp/state";
import { CreateGroupButton, JoinRequestActions } from "./xmtp-actions";

const cards = [
  {
    title: "Coordination",
    body: "XMTP groups are used for agent coordination, capability discovery, and shared planning.",
  },
  {
    title: "Execution",
    body: "Execution remains local. Each Lexon instance keeps its own OWS wallet, policy, and onchain signing boundary.",
  },
  {
    title: "Commerce",
    body: "Paid capability calls are still handled through x402. XMTP carries the negotiation, not the execution authority.",
  },
];

export default function DashboardPage() {
  const configured = isXmtpConfigured();
  const missing = getXmtpMissingConfig();
  const state = getXmtpState();
  const agentStatus = getXmtpAgentStatus();

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="text-cyan text-sm font-semibold mb-3">Private Dashboard</div>
            <h1 className="text-4xl font-semibold tracking-tight mb-4">Lexon XMTP Coordination Console</h1>
            <p className="text-muted" style={{ lineHeight: 1.8 }}>
              This dashboard is the operator surface for XMTP coordination rooms, x402 capability exchange,
              and local execution status. Group messaging stays separate from wallet authority.
            </p>
          </div>
          <div className="term-card max-w-md">
            <div className="text-green font-bold text-sm mb-2">XMTP Status</div>
            <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
              env: <span className="text-cyan">{xmtpConfig.env}</span>
              <br />
              db path: <span className="text-cyan">{xmtpConfig.dbPath}</span>
              <br />
              group id: <span className="text-cyan">{state.group.id}</span>
              <br />
              owner ids: <span className="text-cyan">{config.ownerIds.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-12">
          {cards.map((card) => (
            <div key={card.title} className="term-card">
              <div className="text-green font-bold text-sm mb-2">{card.title}</div>
              <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
                {card.body}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mt-12">
          <div className="term-window">
            <div className="term-titlebar">
              <span className="term-dot term-dot-red" />
              <span className="term-dot term-dot-yellow" />
              <span className="term-dot term-dot-green" />
              <span className="term-title">message schema</span>
            </div>
            <div className="term-body" style={{ fontSize: 12, lineHeight: 1.9 }}>
              {XMTP_MESSAGE_TYPES.map((type) => (
                <div key={type}>
                  <span className="text-cyan">{type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="term-window">
            <div className="term-titlebar">
              <span className="term-dot term-dot-red" />
              <span className="term-dot term-dot-yellow" />
              <span className="term-dot term-dot-green" />
              <span className="term-title">bootstrap</span>
            </div>
            <div className="term-body" style={{ fontSize: 12, lineHeight: 1.8 }}>
              {configured ? (
                <>
                  <div className="text-green">XMTP env vars present</div>
                  <div className="text-muted" style={{ marginTop: 8 }}>
                    runtime started: <span className="text-cyan">{String(agentStatus.started)}</span>
                  </div>
                  {agentStatus.lastError ? (
                    <div className="text-muted" style={{ marginTop: 8 }}>
                      last error: <span className="text-cyan">{agentStatus.lastError}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="text-green">Missing configuration</div>
                  <div className="text-muted" style={{ marginTop: 8 }}>
                    {missing.join(", ")}
                  </div>
                </>
              )}
              <div className="text-muted" style={{ marginTop: 14 }}>
                XMTP requires persistent local storage for its database files across restarts.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mt-12">
          <div className="term-window">
            <div className="term-titlebar">
              <span className="term-dot term-dot-red" />
              <span className="term-dot term-dot-yellow" />
              <span className="term-dot term-dot-green" />
              <span className="term-title">recent group messages</span>
            </div>
            <div className="term-body" style={{ fontSize: 12, lineHeight: 1.8 }}>
              {state.messages.map((message, index) => (
                <div key={`${message.type}-${index}`} style={{ marginBottom: 12 }}>
                  <div className="text-green">{message.type}</div>
                  <div className="text-muted">
                    {message.sender}: {message.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="term-window">
            <div className="term-titlebar">
              <span className="term-dot term-dot-red" />
              <span className="term-dot term-dot-yellow" />
              <span className="term-dot term-dot-green" />
              <span className="term-title">join requests</span>
            </div>
            <div className="term-body" style={{ fontSize: 12, lineHeight: 1.8 }}>
              {state.joinRequests.length === 0 ? (
                <div className="text-muted">No pending requests yet.</div>
              ) : (
                state.joinRequests.map((request) => (
                  <div key={request.id} style={{ marginBottom: 12 }}>
                    <div className="text-green">{request.actorType}</div>
                    <div className="text-muted">
                      {request.actorId} · {request.status}
                    </div>
                    <JoinRequestActions request={request} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 text-sm">
          <CreateGroupButton />
          <Link href="/" className="btn-green px-5 py-2">
            back home
          </Link>
          <Link
            href={`/invite/${state.group.inviteId}`}
            className="px-5 py-2 rounded-full border"
            style={{ borderColor: "var(--border-dim)" }}
          >
            open invite page
          </Link>
          <a
            href="https://docs.xmtp.org/agents/get-started/build-an-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-full border"
            style={{ borderColor: "var(--border-dim)" }}
          >
            XMTP docs
          </a>
        </div>
      </section>
    </main>
  );
}
