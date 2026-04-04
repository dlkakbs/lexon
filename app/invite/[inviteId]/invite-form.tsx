"use client";

import { useState, useTransition } from "react";

export function InviteForm({ inviteId }: { inviteId: string }) {
  const [actorId, setActorId] = useState("");
  const [actorType, setActorType] = useState<"lexon" | "user">("lexon");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div style={{ marginTop: 20 }}>
      <div className="text-green font-bold mb-2">Request access</div>
      <div className="flex flex-col gap-3">
        <input
          value={actorId}
          onChange={(event) => setActorId(event.target.value)}
          placeholder="0x... actor address or operator id"
          style={{
            background: "transparent",
            border: "1px solid var(--border-dim)",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        />
        <select
          value={actorType}
          onChange={(event) => setActorType(event.target.value === "user" ? "user" : "lexon")}
          style={{
            background: "transparent",
            border: "1px solid var(--border-dim)",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        >
          <option value="lexon">lexon</option>
          <option value="user">user</option>
        </select>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Short note for the super admin"
          rows={3}
          style={{
            background: "transparent",
            border: "1px solid var(--border-dim)",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        />
        <button
          className="btn-green px-5 py-2"
          disabled={pending || !actorId.trim()}
          onClick={() =>
            startTransition(async () => {
              setMessage("");
              const res = await fetch("/api/xmtp/join-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  inviteId,
                  actorId,
                  actorType,
                  note,
                }),
              });
              const data = await res.json().catch(() => null);
              setMessage(data?.ok ? "join request submitted" : data?.error || "request failed");
            })
          }
        >
          {pending ? "submitting..." : "request access"}
        </button>
      </div>
      {message ? (
        <div className="text-muted" style={{ marginTop: 10 }}>
          {message}
        </div>
      ) : null}
    </div>
  );
}
