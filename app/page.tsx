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
          <span className="text-muted text-sm">v2.0.0</span>
          <span className="tag tag-green">live</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted fade-in-2">
          <a href="#features" className="hover:text-green transition-colors">features</a>
          <a href="#policy"   className="hover:text-green transition-colors">policy</a>
          <a href="#stack"    className="hover:text-green transition-colors">stack</a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
            className="hover:text-green transition-colors">github</a>
        </div>
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
          className="btn-green px-5 py-2 text-sm fade-in-3">
          $ open telegram
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="flex flex-col lg:flex-row items-start gap-14">

          {/* Left */}
          <div className="flex-1">
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
              DeFi agent.<br />
              <span style={{ color: "var(--text)" }}>Natural language.</span>
            </h1>

            <p className="fade-in-4" style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.8, maxWidth: 480, marginBottom: "2rem" }}>
              Send USDC · swap tokens · bridge cross-chain · track portfolio.
              All via Telegram, text or voice. Policy-gated by OWS.
              Self-hosted — your keys, your limits.
            </p>

            <div className="flex flex-wrap gap-3 fade-in-5">
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

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 mt-10 pt-8 fade-in-6"
              style={{ borderTop: "1px solid var(--border-dim)" }}>
              {[
                { val: "17+", label: "bridge chains" },
                { val: "8",   label: "policy rules" },
                { val: "3",   label: "AI providers" },
                { val: "∞",   label: "self-hosted" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--green)" }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Terminal demo */}
          <div className="flex-1 max-w-md w-full fade-in-4">
            <div className="term-window">
              <div className="term-titlebar">
                <span className="term-dot term-dot-red" />
                <span className="term-dot term-dot-yellow" />
                <span className="term-dot term-dot-green" />
                <span className="term-title">lexon — telegram session</span>
              </div>
              <div className="term-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Boot line */}
                <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>
                  [OK] lexon agent started · Base mainnet · OWS policy active
                </div>

                <div style={{ textAlign: "right" }}>
                  <span className="msg-user">Arbitrum&apos;a 10 USDC bridge et</span>
                </div>
                <div>
                  <span className="msg-bot">
                    <span className="text-yellow">▶ Li.Fi route found</span><br />
                    Base → Arbitrum · 10 USDC<br />
                    fee: ~$0.12 · est. 45s<br /><br />
                    <span className="text-muted">OWS policy: ✓ chain allowed</span><br />
                    <span className="text-muted">OWS policy: ✓ under daily limit</span>
                  </span>
                </div>
                <div>
                  <span className="msg-bot">
                    <span className="text-green">✓ Bridge tx signed by OWS</span><br />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>0x3f8a...c291 · Arbiscan ↗</span>
                  </span>
                </div>

                <hr className="term-divider" style={{ margin: "4px 0" }} />

                <div style={{ textAlign: "right" }}>
                  <span className="msg-user">Portföyüm ne durumda?</span>
                </div>
                <div>
                  <span className="msg-bot">
                    <span className="text-cyan">📊 Portfolio (Zerion)</span><br />
                    Total: <span className="text-green">$284.50</span><br />
                    ETH:  0.081 · Base: $48.20<br />
                    Arb:  $119.40 · Poly: $22.10<br /><br />
                    <span className="text-green">24h PnL: +$6.80 (+2.4%)</span>
                  </span>
                </div>

                <hr className="term-divider" style={{ margin: "4px 0" }} />

                <div style={{ textAlign: "right" }}>
                  <span className="msg-user">0.001 ETH swap to USDC</span>
                </div>
                <div>
                  <span className="msg-bot">
                    <span className="text-green">✓ Swap executed · Uniswap V3</span><br />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>0.001 ETH → 2.87 USDC</span>
                  </span>
                </div>

                <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                  <span className="text-green">lexon@base</span>:~$ <span className="blink">█</span>
                </div>
              </div>
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
            { n: "01", icon: "🎙", title: "Text or voice",  desc: "Send a Telegram message or voice note in any language." },
            { n: "02", icon: "🧠", title: "AI parses intent", desc: "Claude (OpenRouter/Anthropic/OpenAI) extracts the action." },
            { n: "03", icon: "🛡", title: "OWS enforces policy", desc: "8 configurable rules check limits before signing." },
            { n: "04", icon: "⚡", title: "On-chain, done",  desc: "Tx broadcast to Base. Basescan link returned instantly." },
          ].map((s) => (
            <div key={s.n} className="term-card">
              <div className="text-muted text-xs mb-3" style={{ letterSpacing: "0.1em" }}>STEP_{s.n}</div>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
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
                tag: "transfer", tagColor: "tag-green",
                icon: "💸", title: "Send USDC",
                cmd: '"Send 5 USDC to 0x742d..."',
                desc: "Named contacts supported — \"Ali'ye 2 USDC gönder\" via Honcho memory.",
              },
              {
                tag: "defi", tagColor: "tag-green",
                icon: "🔄", title: "Swap Tokens",
                cmd: '"Swap 0.001 ETH to USDC"',
                desc: "Uniswap V3 · Universal Router · Aerodrome. Live ETH price for $100 USD limit.",
              },
              {
                tag: "bridge", tagColor: "tag-cyan",
                icon: "🌉", title: "Cross-chain Bridge",
                cmd: '"Bridge 10 USDC to Arbitrum"',
                desc: "17+ EVM chains via Li.Fi. OWS signs both approve + bridge tx.",
              },
              {
                tag: "data", tagColor: "tag-cyan",
                icon: "📊", title: "Portfolio (Zerion)",
                cmd: "/portfolio · /pnl",
                desc: "Multi-chain holdings, positions, 24h PnL across 40+ networks.",
              },
              {
                tag: "ai", tagColor: "tag-yellow",
                icon: "🧠", title: "Personalized Memory",
                cmd: '"Bu hafta ne harcadım?"',
                desc: "Honcho remembers your habits, named addresses, spending history.",
              },
              {
                tag: "voice", tagColor: "tag-green",
                icon: "🎙", title: "Voice Commands",
                cmd: "Send a voice note",
                desc: "OpenAI Whisper transcribes any language, any command.",
              },
              {
                tag: "security", tagColor: "tag-yellow",
                icon: "🛡", title: "OWS Policy (8 rules)",
                cmd: "/policy",
                desc: "Per-tx, daily, cooldown, contract whitelist — all configurable via .env.",
              },
              {
                tag: "notify", tagColor: "tag-cyan",
                icon: "📩", title: "XMTP Notifications",
                cmd: "auto on payment",
                desc: "Recipient's wallet address gets a wallet-native payment alert.",
              },
              {
                tag: "onramp", tagColor: "tag-green",
                icon: "💳", title: "MoonPay On-Ramp",
                cmd: "/fund",
                desc: "Buy USDC directly into the Lexon wallet without leaving Telegram.",
              },
              {
                tag: "query", tagColor: "tag-green",
                icon: "💰", title: "Balance & Price",
                cmd: '"What\'s my balance?" /price',
                desc: "ETH + USDC on Base. Live ETH price from Chainlink-style feed.",
              },
              {
                tag: "whitelist", tagColor: "tag-yellow",
                icon: "✅", title: "Contract Whitelist",
                cmd: "/approve /unapprove",
                desc: "Manage OWS policy contract list from Telegram. Persisted to disk.",
              },
              {
                tag: "selfhost", tagColor: "tag-cyan",
                icon: "⚙️", title: "Self-Hosted",
                cmd: "npx tsx setup.ts",
                desc: "Interactive wizard configures everything. Your instance, your keys.",
              },
            ].map((f) => (
              <div key={f.title} className="term-card">
                <div className="flex items-start justify-between mb-3">
                  <span style={{ fontSize: 24 }}>{f.icon}</span>
                  <span className={`tag ${f.tagColor}`}>{f.tag}</span>
                </div>
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

      {/* ── OWS Policy ── */}
      <section id="policy" className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10">
          <span className="text-muted text-sm">$ </span>
          <span className="text-green text-sm font-bold">cat .env.local | grep OWS</span>
        </div>
        <div className="grid md:grid-cols-2 gap-6">

          <div className="term-window">
            <div className="term-titlebar">
              <span className="term-dot term-dot-red" />
              <span className="term-dot term-dot-yellow" />
              <span className="term-dot term-dot-green" />
              <span className="term-title">lexon-policy.json</span>
            </div>
            <div className="term-body" style={{ fontSize: 12 }}>
              <div className="text-muted">{"{"}</div>
              <div style={{ paddingLeft: 16 }}>
                <div><span className="text-cyan">&quot;id&quot;</span>: <span className="text-yellow">&quot;lexon-policy&quot;</span>,</div>
                <div><span className="text-cyan">&quot;action&quot;</span>: <span className="text-yellow">&quot;deny&quot;</span>,</div>
                <div><span className="text-cyan">&quot;rules&quot;</span>: [</div>
                <div style={{ paddingLeft: 16 }}>
                  {[
                    ['allowed_chains',           'eip155:8453 + 12 more'],
                    ['max_value_per_tx',         'USDC $100   ← MAX_SEND_USDC'],
                    ['max_value_per_day',        'USDC $100   ← MAX_DAILY_USDC'],
                    ['max_tx_per_day',           '20          ← OWS_MAX_TX_PER_DAY'],
                    ['cooldown',                 '30s         ← OWS_COOLDOWN_SECONDS'],
                    ['max_per_address_day',      'USDC $50    ← OWS_MAX_PER_ADDRESS_DAILY'],
                    ['allowed_contracts',        'Uniswap · Aerodrome · Li.Fi + more'],
                    ['require_confirmation',     'above $25   ← OWS_CONFIRM_ABOVE_USDC'],
                  ].map(([rule, val]) => (
                    <div key={rule} style={{ marginBottom: 2 }}>
                      <span className="text-green">&quot;{rule}&quot;</span>
                      <span className="text-muted"> → </span>
                      <span style={{ color: "var(--text)", opacity: 0.8 }}>{val}</span>
                    </div>
                  ))}
                </div>
                <div>]</div>
              </div>
              <div className="text-muted">{"}"}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="text-muted text-xs mb-2" style={{ letterSpacing: "0.08em" }}>ALL RULES COME FROM .env.local — ZERO HARDCODED LIMITS</div>
            {[
              { env: "MAX_SEND_USDC",            default: "100", desc: "Max USDC per transaction" },
              { env: "MAX_DAILY_USDC",           default: "100", desc: "Daily USDC spending cap" },
              { env: "MAX_SWAP_USD",             default: "100", desc: "Max swap value (ETH or USDC, live price)" },
              { env: "OWS_MAX_TX_PER_DAY",       default: "20",  desc: "Transaction count limit" },
              { env: "OWS_COOLDOWN_SECONDS",     default: "30",  desc: "Seconds between transactions" },
              { env: "OWS_MAX_PER_ADDRESS_DAILY",default: "50",  desc: "Max per recipient per day" },
              { env: "OWS_CONFIRM_ABOVE_USDC",   default: "25",  desc: "Ask confirmation above this" },
              { env: "OWS_ALLOWED_CHAINS",       default: "13",  desc: "Comma-separated eip155 chain IDs" },
            ].map((r) => (
              <div key={r.env} className="term-card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="text-cyan" style={{ fontSize: 11, fontWeight: 700 }}>{r.env}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>{r.desc}</div>
                </div>
                <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>{r.default}</div>
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
                    { mod: "@open-wallet-standard/core", role: "Wallet · Policy · Signing", note: "8-rule policy, OWS Hackathon 2026", tag: "tag-green" },
                    { mod: "Li.Fi REST API",             role: "Cross-chain Bridge",        note: "17+ EVM chains, no API key needed", tag: "tag-cyan" },
                    { mod: "@honcho-ai/sdk",             role: "Personalized Memory",       note: "User habits, named contacts, spending history", tag: "tag-yellow" },
                    { mod: "Zerion REST API",            role: "Portfolio · PnL · Txs",     note: "40+ chains, OWS partner", tag: "tag-cyan" },
                    { mod: "Claude / OpenRouter",        role: "Intent Parsing",            note: "Multi-provider: openrouter | anthropic | openai", tag: "tag-yellow" },
                    { mod: "OpenAI Whisper",             role: "Voice Transcription",       note: "Telegram voice note → text", tag: "tag-green" },
                    { mod: "@xmtp/xmtp-js",             role: "Payment Notifications",     note: "Wallet-native alerts on transfer", tag: "tag-cyan" },
                    { mod: "MoonPay",                   role: "USDC On-Ramp",              note: "/fund command, direct into OWS wallet", tag: "tag-green" },
                    { mod: "viem",                      role: "Base Client",               note: "TX construction, USDC helpers, Uniswap ABI", tag: "tag-green" },
                    { mod: "grammy",                    role: "Telegram Bot Framework",    note: "Webhook + polling mode", tag: "tag-green" },
                    { mod: "next.js",                   role: "Landing + Webhook API",     note: "App router, /api/webhook route", tag: "tag-green" },
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
                ['"Send 5 USDC to 0x…"',       "Transfer"],
                ['"Swap 0.001 ETH to USDC"',   "Swap"],
                ['"Bridge 10 USDC to Arb"',    "Bridge"],
                ['"Portföyüm ne durumda?"',     "Portfolio"],
                ['"Bu hafta ne harcadım?"',     "Spending history"],
                ["🎙 voice note",               "Whisper → any command"],
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
                    ↑ interactive wizard<br />
                    configures all keys + limits
                  </div>
                  <div className="prompt text-green">npx tsx dev-bot.ts</div>
                  <div className="text-green" style={{ fontSize: 11, marginTop: 6 }}>
                    ✓ lexon agent started<br />
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
          Your DeFi agent awaits.
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 36, lineHeight: 1.8 }}>
          Open Telegram. Type or speak. Watch it settle on Base.<br />
          No wallet setup. No dApp. Just a chat.
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
        <div className="flex gap-6">
          <span>OWS · Li.Fi · Honcho · Zerion · Claude</span>
        </div>
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
