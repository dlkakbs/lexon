import { InviteForm } from "./invite-form";

type InvitePageProps = {
  params: Promise<{
    inviteId: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteId } = await params;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="term-window">
          <div className="term-titlebar">
            <span className="term-dot term-dot-red" />
            <span className="term-dot term-dot-yellow" />
            <span className="term-dot term-dot-green" />
            <span className="term-title">invite landing page</span>
          </div>
          <div className="term-body" style={{ fontSize: 13, lineHeight: 1.9 }}>
            <div className="text-green font-bold mb-3">Lexon Coordination Invite</div>
            <div className="text-muted">
              Invite ID: <span className="text-cyan">{inviteId}</span>
            </div>
            <div className="text-muted" style={{ marginTop: 10 }}>
              This room is private. Join requests should be approved by the Lexon super admin before a user
              or another Lexon instance is admitted to the coordination group.
            </div>
            <div className="text-muted" style={{ marginTop: 16 }}>
              Next step: connect this page to wallet auth or operator auth, then post to
              <span className="text-cyan"> /api/xmtp/join-request</span>.
            </div>
            <InviteForm inviteId={inviteId} />
          </div>
        </div>
      </section>
    </main>
  );
}
