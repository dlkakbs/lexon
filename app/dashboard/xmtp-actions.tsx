"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type JoinRequest = {
  id: string;
  actorId: string;
  actorType: "lexon" | "user";
  status: "pending" | "approved" | "rejected";
};

export function CreateGroupButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <button
        className="btn-green px-5 py-2"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setMessage("");
            const res = await fetch("/api/xmtp/group", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ members: [] }),
            });
            const data = await res.json().catch(() => null);
            setMessage(data?.ok ? `group ready: ${data.groupId}` : data?.error || "group create failed");
            router.refresh();
          })
        }
      >
        {pending ? "creating..." : "create XMTP group"}
      </button>
      {message ? (
        <div className="text-muted" style={{ marginTop: 8, fontSize: 12 }}>
          {message}
        </div>
      ) : null}
    </div>
  );
}

export function JoinRequestActions({ request }: { request: JoinRequest }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function submit(action: "approve" | "reject") {
    startTransition(async () => {
      setMessage("");
      const res = await fetch("/api/xmtp/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId: request.id,
        }),
      });
      const data = await res.json().catch(() => null);
      setMessage(data?.ok ? `${action}d` : data?.error || `${action} failed`);
      router.refresh();
    });
  }

  if (request.status !== "pending") {
    return <div className="text-muted">{request.status}</div>;
  }

  return (
    <div>
      <div className="flex gap-2" style={{ marginTop: 8 }}>
        <button
          className="btn-green px-3 py-1"
          disabled={pending}
          onClick={() => submit("approve")}
        >
          approve
        </button>
        <button
          className="px-3 py-1 rounded-full border"
          style={{ borderColor: "var(--border-dim)" }}
          disabled={pending}
          onClick={() => submit("reject")}
        >
          reject
        </button>
      </div>
      {message ? (
        <div className="text-muted" style={{ marginTop: 8, fontSize: 12 }}>
          {message}
        </div>
      ) : null}
    </div>
  );
}
