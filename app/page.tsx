const TELEGRAM_URL = "https://t.me/lexon_bot";
const GITHUB_URL   = "https://github.com/dlkakbs/lexon";

export default function Home() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>

      {/* ── Navbar ── */}
      <nav style={{ borderBottom: "1px solid var(--border-dim)" }}
        className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 fade-in-1">
          <span className="text-green font-bold text-lg">lexon</span>
          <span className="tag tag-green">live</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted fade-in-2">
          <a href="#features" className="hover:text-green transition-colors">features</a>
          <a href="#policy"   className="hover:text-green transition-colors">policy</a>
          <a href="#stack"    className="hover:text-green transition-colors">stack</a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
            className="hover:text-green transition-colors">github</a>
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

            <div className="fade-in-2 mb-3" style={{ fontSize: 13, color: "var(--muted)" }}>
              <span className="text-green">lexon@base</span>
              <span className="text-muted">:</span>
              <span className="text-cyan">~</span>
              <span className="text-muted">$ </span>
              <span className="text-green">./start --agent</span>
              <span className="blink" style={{ color: "var(--green)" }}>█</span>
            </div>

            <h1 className="fade-in-3 glow" style={{
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--green)",
              marginBottom: "1.5rem",
            }}>
              Self-hosted<br />
              <span style={{ color: "var(--text)" }}>DeFi agent.</span>
            </h1>

            <p className="fade-in-4" style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.8, maxWidth: 480, marginBottom: "2rem", marginLeft: "auto", marginRight: "auto" }}>
              Send USDC · swap tokens · bridge cross-chain · track portfolio.
              All via Telegram, text or voice. Policy-gated by OWS.
              Your wallet, your limits, your agent.
            </p>

            <div className="flex flex-wrap gap-3 justify-center fade-in-5">
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                className="btn-green px-7 py-3 text-sm flex items-center gap-2">
                <TelegramIcon />
                $ start lexon
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
                className="btn-outline px-7 py-3 text-sm">
                git clone
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
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { n: "01", title: "Text or Voice",       desc: "Send a Telegram message or voice note in any language." },
            { n: "02", title: "From message to action", desc: "Lexon understands what you want and maps it to an on-chain action." },
            { n: "03", title: "OWS enforces policy", desc: "Your rules validate the transaction before anything is signed." },
            { n: "04", title: "On-chain execution",  desc: "Transaction broadcast to Base with instant receipt." },
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
                desc: "Bridge from Base to 17+ chains.",
              },
              {
                title: "Portfolio",
                cmd: "portfolio",
                desc: "Multi-chain balances and PnL.",
              },
              {
                title: "Policy",
                cmd: "policy",
                desc: "Chain, spend, and contract controls.",
              },
              {
                title: "Voice",
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
                desc: "Optional USDC on-ramp.",
              },
              {
                title: "x402",
                cmd: "catalog",
                desc: "Optional paid capabilities.",
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
                    { mod: "@open-wallet-standard/core", role: "Wallet · Policy · Signing", note: "OWS access control and transaction signing" },
                    { mod: "Li.Fi REST API",             role: "Bridge",                    note: "Cross-chain routing from Base" },
                    { mod: "Zerion REST API",            role: "Portfolio",                 note: "Balances, positions, and PnL" },
                    { mod: "Claude / OpenRouter",        role: "Intent Parsing",            note: "Natural language to action" },
                    { mod: "OpenAI Whisper",             role: "Voice Input",               note: "Voice note transcription" },
                    { mod: "grammy",                    role: "Telegram Bot",              note: "Webhook + bot command handling" },
                    { mod: "@x402/next · @x402/fetch",   role: "Optional x402",             note: "Paid capabilities when enabled" },
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

      {/* ── Bridge chains ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-8">
          <span className="text-muted text-sm">$ </span>
          <span className="text-green text-sm font-bold">lexon bridge --list-chains</span>
        </div>
        <div className="term-card" style={{ padding: "20px 24px" }}>
          <div className="text-muted text-xs mb-4" style={{ letterSpacing: "0.08em" }}>SUPPORTED BRIDGE DESTINATIONS (FROM BASE · VIA LI.FI + OWS)</div>
          <div className="flex flex-wrap gap-2">
            {[
              "Ethereum","Polygon","Arbitrum","Optimism","BNB Chain",
              "Avalanche","zkSync Era","Linea","Scroll","Blast",
              "Mantle","Unichain","Sonic","Berachain","Gnosis","Celo",
            ].map((chain) => (
              <span key={chain} className="tag tag-green" style={{ fontSize: 11 }}>{chain}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Commands ref ── */}
      <section style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--border-dim)", borderBottom: "1px solid var(--border-dim)" }}
        className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <span className="text-muted text-sm">$ </span>
            <span className="text-green text-sm font-bold">lexon --help</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">

            <div>
              <div className="text-cyan text-xs mb-4" style={{ letterSpacing: "0.1em" }}>COMMANDS</div>
              {[
                ["/wallet",    "Show wallet address + Basescan link"],
                ["/portfolio", "Multi-chain portfolio (Zerion)"],
                ["/pnl",       "24h profit/loss"],
                ["/price",     "Live ETH price"],
                ["/bridge",    "Bridge info + chain list"],
                ["/policy",    "Active OWS policy rules"],
                ["/fund",      "MoonPay on-ramp link"],
                ["/memory",    "What Lexon knows about you"],
                ["/update",    "Pull latest from git"],
                ["/help",      "This menu"],
              ].map(([cmd, desc]) => (
                <div key={cmd} className="flex gap-3 py-1.5" style={{ borderBottom: "1px solid var(--border-dim)", fontSize: 12 }}>
                  <span className="text-green" style={{ minWidth: 90 }}>{cmd}</span>
                  <span className="text-muted">{desc}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="text-cyan text-xs mb-4" style={{ letterSpacing: "0.1em" }}>ALLOWLIST · WHITELIST</div>
              {[
                ["/add 0x… [label]",     "Add address to send allowlist"],
                ["/remove 0x…",          "Remove from allowlist"],
                ["/list",                "Show all allowed addresses"],
                ["/approve 0x… [label]", "Add contract to OWS policy"],
                ["/unapprove 0x…",       "Remove contract from policy"],
                ["/contracts",           "List all approved contracts"],
              ].map(([cmd, desc]) => (
                <div key={cmd} className="flex gap-3 py-1.5" style={{ borderBottom: "1px solid var(--border-dim)", fontSize: 12 }}>
                  <span className="text-green" style={{ minWidth: 150, flexShrink: 0 }}>{cmd}</span>
                  <span className="text-muted">{desc}</span>
                </div>
              ))}
              <div className="text-cyan text-xs mt-6 mb-4" style={{ letterSpacing: "0.1em" }}>NATURAL LANGUAGE</div>
              {[
                ['"Send 5 USDC to 0x…"',      "Transfer"],
                ['"Swap 0.001 ETH to USDC"',  "Swap"],
                ['"Bridge 10 USDC to Arb"',   "Bridge"],
                ['"Show my portfolio"',        "Portfolio"],
                ['"How much did I spend?"',    "Spending history"],
                ["voice note",                 "Whisper transcribes any language"],
              ].map(([cmd, desc]) => (
                <div key={cmd} className="flex gap-3 py-1.5" style={{ borderBottom: "1px solid var(--border-dim)", fontSize: 12 }}>
                  <span className="text-yellow" style={{ minWidth: 160, flexShrink: 0 }}>{cmd}</span>
                  <span className="text-muted">{desc}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="text-cyan text-xs mb-4" style={{ letterSpacing: "0.1em" }}>QUICK SETUP</div>
              <div className="term-window">
                <div className="term-titlebar">
                  <span className="term-dot term-dot-red" />
                  <span className="term-dot term-dot-yellow" />
                  <span className="term-dot term-dot-green" />
                  <span className="term-title">terminal</span>
                </div>
                <div className="term-body" style={{ fontSize: 12 }}>
                  <div className="prompt text-green">git clone github.com/dlkakbs/lexon</div>
                  <div className="prompt text-green">cd lexon && npm install</div>
                  <div className="prompt text-green">npx tsx setup.ts</div>
                  <div className="text-muted" style={{ fontSize: 11, margin: "8px 0" }}>
                    interactive wizard —<br />
                    configures all keys + limits
                  </div>
                  <div className="prompt text-green">npx tsx dev-bot.ts</div>
                  <div className="text-green" style={{ fontSize: 11, marginTop: 6 }}>
                    [OK] lexon agent started<br />
                    <span className="text-muted">listening for messages...</span>
                    <span className="blink"> █</span>
                  </div>
                </div>
              </div>
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
          Open Telegram. Type or speak. Watch it settle on Base.<br />
          Self-host it, set the limits, keep the wallet under control.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
            className="btn-green px-10 py-4 text-sm flex items-center gap-2">
            <TelegramIcon />
            $ start lexon
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
            className="btn-outline px-10 py-4 text-sm">
            self-host →
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
