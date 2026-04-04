const TELEGRAM_URL = "https://t.me/lexon_bot";
const GITHUB_URL   = "https://github.com/dlkakbs/lexon";
const OWS_URL      = "https://openwallet.sh/";
const X402_PRICE   = process.env.X402_DEFAULT_PRICE || "$0.01";

export default function Home() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>

      {/* ── Navbar ── */}
      <nav style={{ borderBottom: "1px solid var(--border-dim)" }}
        className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 fade-in-1">
          <span className="text-green font-bold text-xl">lexon</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted fade-in-2">
          <a href="#features" className="hover:text-green transition-colors">features</a>
          <a href="#policy"   className="hover:text-green transition-colors">policy</a>
          <a href="#stack"    className="hover:text-green transition-colors">stack</a>
        </div>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
          className="btn-green px-5 py-2 text-sm fade-in-3">
          github
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div>
            <div className="flex items-center gap-2 mb-6 fade-in-1">
              <span className="tag tag-cyan">OWS Hackathon 2026</span>
              <span className="tag tag-green">Base Mainnet</span>
            </div>

            <h1 className="fade-in-3 glow" style={{
              fontSize: "clamp(1.95rem, 4.2vw, 3rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--green)",
              marginBottom: "1.5rem",
            }}>
              Self-hosted, policy-gated<br />
              <span style={{ color: "var(--text)" }}>wallet operator for</span><br />
              <span style={{ color: "var(--text)" }}>AI agents</span>
            </h1>

            <p className="fade-in-4" style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.8, maxWidth: 620, marginBottom: "2rem", marginLeft: "auto", marginRight: "auto" }}>
              Lexon runs as a Telegram-based agent interface, uses OWS for delegated wallet access under user-defined rules,
              and executes actions on Base.
            </p>

            <div className="fade-in-5">
              <a
                href={OWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 text-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--green)",
                  background: "var(--green)",
                  color: "var(--bg)",
                  borderRadius: 999,
                }}
              >
                Explore Open Wallet
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10">
          <span className="text-muted text-sm">$ </span>
          <span className="text-green text-sm font-bold">cat HOW_IT_WORKS.md</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { n: "01", title: "Natural input", desc: "Send a message via Telegram, voice, or call the Lexon API as an agent." },
            { n: "02", title: "Intent to capability routing", desc: "Lexon interprets the request and routes it to an execution action or a capability endpoint." },
            { n: "03", title: "OWS delegated access", desc: "OWS gives the agent delegated wallet access and evaluates policy-defined limits and constraints before signing." },
            { n: "04", title: "Payment (x402, optional)", desc: "For external calls, Lexon can require payment via x402 so capabilities become monetizable APIs." },
            { n: "05", title: "On-chain execution", desc: "If approved, the transaction is signed via OWS, broadcast to Base, and a receipt is returned." },
            { n: "06", title: "Audit and transparency", desc: "Every action produces decision logs, denial reasons when relevant, and usage summaries." },
          ].map((s) => (
            <div key={s.n} className="term-card">
              <div className="text-green font-bold text-sm mb-2">{s.title}</div>
              <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--border-dim)", borderBottom: "1px solid var(--border-dim)" }}
        className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <span className="text-muted text-sm">$ </span>
            <span className="text-green text-sm font-bold">lexon --list-features</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Send USDC",
                cmd: "send",
                desc: "Send to an address or saved contact.",
              },
              {
                title: "Swap",
                cmd: "swap",
                desc: "ETH ↔ USDC on Base.",
              },
              {
                title: "Bridge",
                cmd: "bridge",
                desc: "Bridge from Base to 10+ chains.",
              },
              {
                title: "Wallet Intelligence",
                cmd: "portfolio",
                desc: "Balances, wallet score, and recent patterns.",
              },
              {
                title: "OWS Delegated Access",
                cmd: "policy",
                desc: "Delegated wallet access with policy-defined limits before signing.",
              },
              {
                title: "Policy Trace",
                cmd: "audit",
                desc: "Visible decisions, denial reasons, and usage logs.",
              },
              {
                title: "Voice Interface",
                cmd: "voice",
                desc: "Speak instead of typing.",
              },
              {
                title: "Memory",
                cmd: "memory",
                desc: "Saved contacts and habits.",
              },
              {
                title: "MoonPay",
                cmd: "on-ramp",
                desc: "Fund the wallet on Base.",
              },
              {
                title: "x402 Capabilities",
                cmd: "catalog",
                desc: "Monetizable capabilities over x402.",
              },
            ].map((f) => (
              <div key={f.title} className="term-card">
                <div className="text-green font-bold text-sm mb-1">{f.title}</div>
                <div className="text-cyan" style={{ fontSize: 11, marginBottom: 8, opacity: 0.8 }}>
                  &gt; {f.cmd}
                </div>
                <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live x402 capability ── */}
      <section id="policy" className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-8">
          <div className="text-green font-bold text-sm mb-2">Live x402 Capability</div>
          <div className="text-muted" style={{ fontSize: 13, lineHeight: 1.8, maxWidth: 640 }}>
            Any agent can call this endpoint and pay via x402.
          </div>
        </div>
        <div className="term-window" style={{ maxWidth: 760 }}>
          <div className="term-titlebar">
            <span className="term-dot term-dot-red" />
            <span className="term-dot term-dot-yellow" />
            <span className="term-dot term-dot-green" />
            <span className="term-title">evaluate_bridge</span>
          </div>
          <div className="term-body" style={{ fontSize: 12, lineHeight: 1.8 }}>
            <div className="text-cyan">endpoint</div>
            <div className="text-muted">/api/x402/paid/evaluate-bridge</div>

            <div className="text-cyan" style={{ marginTop: 10 }}>input</div>
            <div className="text-muted">fromChain · toChain · fromToken · amount</div>

            <div className="text-cyan" style={{ marginTop: 10 }}>output</div>
            <div className="text-muted">allow/deny · matched rules · route · fee</div>

            <div className="text-cyan" style={{ marginTop: 10 }}>payment</div>
            <div className="text-muted">paid via x402 · {X402_PRICE}</div>
          </div>
        </div>
      </section>

      {/* ── Stack ── */}
      <section id="stack" style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--border-dim)", borderBottom: "1px solid var(--border-dim)" }}
        className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <span className="text-muted text-sm">$ </span>
            <span className="text-green text-sm font-bold">cat package.json | jq .dependencies</span>
          </div>
          <div className="term-window">
            <div className="term-titlebar">
              <span className="term-dot term-dot-red" />
              <span className="term-dot term-dot-yellow" />
              <span className="term-dot term-dot-green" />
              <span className="term-title">stack — lexon v2.0</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="term-table">
                <thead>
                  <tr>
                    <th>module</th>
                    <th>role</th>
                    <th>notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { mod: "@open-wallet-standard/core", role: "Wallet · Agent Access · Policy · Signing", note: "Local wallet management, scoped agent access, policy validation, and transaction signing" },
                    { mod: "Li.Fi REST API",             role: "Bridge",                    note: "Cross-chain routing from Base" },
                    { mod: "Zerion REST API",            role: "Portfolio",                 note: "Balances, positions, and PnL" },
                    { mod: "Allium Realtime API",        role: "Wallet Intelligence",       note: "Base wallet activity, scoring, and behavior patterns" },
                    { mod: "Claude / OpenRouter",        role: "Intent Parsing",            note: "Natural language to action" },
                    { mod: "OpenAI Whisper",             role: "Voice Input",               note: "Voice note transcription" },
                    { mod: "grammy",                    role: "Telegram Bot",              note: "Webhook + bot command handling" },
                    { mod: "@x402/next · @x402/fetch",   role: "x402 Commerce Layer",       note: "Monetizable capabilities and agent payments" },
                  ].map((r) => (
                    <tr key={r.mod}>
                      <td><span className="text-green" style={{ fontSize: 12 }}>{r.mod}</span></td>
                      <td style={{ fontSize: 12 }}>{r.role}</td>
                      <td><span className="text-muted" style={{ fontSize: 11 }}>{r.note}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="text-muted text-sm mb-4">
          <span className="text-green">lexon@base</span>:~$ <span className="text-green">./launch --now</span>
        </div>
        <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 700, color: "var(--green)", letterSpacing: "-0.02em", marginBottom: 16 }}
          className="glow">
          Run your own DeFi agent.
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 36, lineHeight: 1.8 }}>
          Type or speak via Telegram, or call it via API.<br />
          Lexon executes on Base — fully self-hosted, policy-controlled, and transparent.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
            className="btn-green px-10 py-4 text-sm flex items-center gap-2">
            <TelegramIcon />
            github
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border-dim)", color: "var(--muted)", fontSize: 12 }}
        className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <span className="text-green">lexon</span> · OWS Hackathon 2026 · Base Mainnet
        </div>
        <div>OWS · Li.Fi · Honcho · Zerion · Claude</div>
        <div>
          <span className="text-green blink">█</span>
          <span style={{ marginLeft: 6 }}>MIT License</span>
        </div>
      </footer>

    </div>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
