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
              Self-hosted — your keys, your limits, your agent.
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
                { val: "2+1", label: "OWS policy layers" },
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

                <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>
                  [OK] lexon agent started · Base mainnet · OWS policy active
                </div>

                <div style={{ textAlign: "right" }}>
                  <span className="msg-user">Bridge 10 USDC to Arbitrum</span>
                </div>
                <div>
                  <span className="msg-bot">
                    <span className="text-yellow">Li.Fi route found</span><br />
                    Base → Arbitrum · 10 USDC<br />
                    fee: ~$0.12 · est. 45s<br /><br />
                    <span className="text-muted">OWS: chain allowed + expiry ok</span><br />
                    <span className="text-muted">spend guard: under daily limit</span>
                  </span>
                </div>
                <div>
                  <span className="msg-bot">
                    <span className="text-green">Bridge tx signed by OWS</span><br />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>0x3f8a...c291 · Arbiscan ↗</span>
                  </span>
                </div>

                <hr className="term-divider" style={{ margin: "4px 0" }} />

                <div style={{ textAlign: "right" }}>
                  <span className="msg-user">Show my portfolio</span>
                </div>
                <div>
                  <span className="msg-bot">
                    <span className="text-cyan">Portfolio (Zerion)</span><br />
                    Total: <span className="text-green">$284.50</span><br />
                    ETH:  0.081 · Base: $48.20<br />
                    Arb:  $119.40 · Poly: $22.10<br /><br />
                    <span className="text-green">24h PnL: +$6.80 (+2.4%)</span>
                  </span>
                </div>

                <hr className="term-divider" style={{ margin: "4px 0" }} />

                <div style={{ textAlign: "right" }}>
                  <span className="msg-user">Swap 0.001 ETH to USDC</span>
                </div>
                <div>
                  <span className="msg-bot">
                    <span className="text-green">Swap executed · Uniswap V3</span><br />
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
            { n: "01", title: "Text or voice",       desc: "Send a Telegram message or voice note in any language — Whisper handles the rest." },
            { n: "02", title: "AI parses intent",    desc: "Claude (OpenRouter / Anthropic / OpenAI) extracts the action from natural language." },
            { n: "03", title: "OWS policy gates signing", desc: "Declarative rules check chain + expiry. Custom executable checks USDC amount, ETH value, and contract allowlist — key material never touched if denied." },
            { n: "04", title: "On-chain, done",      desc: "Transaction broadcast to Base. Basescan link returned instantly." },
          ].map((s) => (
            <div key={s.n} className="term-card">
              <div className="text-muted text-xs mb-4" style={{ letterSpacing: "0.1em" }}>STEP_{s.n}</div>
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
                title: "Send USDC",
                cmd: '"Send 5 USDC to 0x742d..."',
                desc: "Named contacts supported via Honcho memory. \"Send 2 USDC to Alice\" resolves to address.",
              },
              {
                tag: "defi", tagColor: "tag-green",
                title: "Swap Tokens",
                cmd: '"Swap 0.001 ETH to USDC"',
                desc: "Uniswap V3 · Universal Router · Aerodrome. Live ETH price used for $100 USD swap limit.",
              },
              {
                tag: "bridge", tagColor: "tag-cyan",
                title: "Cross-chain Bridge",
                cmd: '"Bridge 10 USDC to Arbitrum"',
                desc: "17+ EVM chains via Li.Fi. OWS signs both the approve and bridge transactions.",
              },
              {
                tag: "data", tagColor: "tag-cyan",
                title: "Portfolio (Zerion)",
                cmd: "/portfolio · /pnl",
                desc: "View holdings, positions, and 24h PnL across all chains where your address has assets — powered by Zerion.",
              },
              {
                tag: "ai", tagColor: "tag-yellow",
                title: "Personalized Memory",
                cmd: '"How much did I spend this week?"',
                desc: "Honcho remembers your habits, named addresses, and spending history across sessions.",
              },
              {
                tag: "voice", tagColor: "tag-green",
                title: "Voice Commands",
                cmd: "Send a voice note",
                desc: "OpenAI Whisper transcribes voice notes in any language. Any command works via voice.",
              },
              {
                tag: "security", tagColor: "tag-yellow",
                title: "OWS Policy Engine",
                cmd: "/policy",
                desc: "Declarative rules (chain, expiry) + custom executable (USDC cap, ETH cap, contract allowlist). Agent-mode API key required — policy bypassed in owner mode.",
              },
              {
                tag: "notify", tagColor: "tag-cyan",
                title: "XMTP Notifications",
                cmd: "auto on payment",
                desc: "Recipient wallet address gets a wallet-native payment alert visible in Coinbase Wallet, Converse.",
              },
              {
                tag: "onramp", tagColor: "tag-green",
                title: "MoonPay On-Ramp",
                cmd: "/fund",
                desc: "Buy USDC directly into the Lexon wallet without leaving Telegram.",
              },
              {
                tag: "query", tagColor: "tag-green",
                title: "Balance & Price",
                cmd: '"What\'s my balance?" · /price',
                desc: "ETH + USDC balance on Base. Live ETH price.",
              },
              {
                tag: "whitelist", tagColor: "tag-yellow",
                title: "Contract Whitelist",
                cmd: "/approve · /unapprove",
                desc: "Manage the OWS policy contract list from Telegram. Persisted to disk between restarts.",
              },
              {
                tag: "selfhost", tagColor: "tag-cyan",
                title: "Self-Hosted",
                cmd: "npx tsx setup.ts",
                desc: "Interactive wizard configures all keys and limits. Your instance, your OWS wallet, your policy.",
              },
              {
                tag: "x402", tagColor: "tag-yellow",
                title: "Agent Commerce Layer",
                cmd: "/api/x402/catalog",
                desc: "Optional x402 layer for publishing paid capabilities and buying other agent services without changing the core self-hosted flow.",
              },
            ].map((f) => (
              <div key={f.title} className="term-card">
                <div className="flex items-start justify-between mb-3">
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
                <div style={{ marginTop: 6 }}><span className="text-muted">// declarative rules — evaluated in-process</span></div>
                <div><span className="text-cyan">&quot;rules&quot;</span>: [</div>
                <div style={{ paddingLeft: 16 }}>
                  {[
                    ["allowed_chains", "eip155:8453 + 12 more  <- OWS native"],
                    ["expires_at",     "2027-01-01              <- OWS native"],
                  ].map(([rule, val]) => (
                    <div key={rule} style={{ marginBottom: 2 }}>
                      <span className="text-green">&quot;{rule}&quot;</span>
                      <span className="text-muted"> → </span>
                      <span style={{ color: "var(--text)", opacity: 0.8 }}>{val}</span>
                    </div>
                  ))}
                </div>
                <div>],</div>
                <div style={{ marginTop: 6 }}><span className="text-muted">// custom executable — runs after declarative rules pass</span></div>
                <div><span className="text-cyan">&quot;executable&quot;</span>: <span className="text-yellow">&quot;policy/spend_limit.js&quot;</span>,</div>
                <div><span className="text-cyan">&quot;config&quot;</span>: {"{"}</div>
                <div style={{ paddingLeft: 16 }}>
                  {[
                    ["max_usdc_per_tx",    "$100  ERC-20 data decoded"],
                    ["max_eth_per_tx_wei", "0.05 ETH  transaction.value"],
                    ["max_daily_eth_wei",  "0.1 ETH   spending.daily_total"],
                    ["trusted_contracts",  "Uniswap · Aerodrome · Li.Fi"],
                    ["contracts_file",     "data/contracts.json  (live read)"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 2 }}>
                      <span className="text-green">&quot;{k}&quot;</span>
                      <span className="text-muted"> → </span>
                      <span style={{ color: "var(--text)", opacity: 0.8 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div>{"}"}</div>
              </div>
              <div className="text-muted">{"}"}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="text-muted text-xs mb-1" style={{ letterSpacing: "0.08em" }}>OWS ENFORCES VIA EXECUTABLE</div>
            {[
              { env: "MAX_SEND_USDC",     default: "100",  desc: "USDC per-tx cap (ERC-20 data decoded)", tag: "OWS" },
              { env: "OWS_MAX_ETH_PER_TX",default: "0.05", desc: "ETH per-tx cap (transaction.value wei)", tag: "OWS" },
              { env: "OWS_ALLOWED_CHAINS",default: "13",   desc: "Chain allowlist (declarative rule)", tag: "OWS" },
            ].map((r) => (
              <div key={r.env} className="term-card" style={{ padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="text-cyan" style={{ fontSize: 11, fontWeight: 700 }}>{r.env}</span>
                    <span className="tag tag-green" style={{ fontSize: 9 }}>{r.tag}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: 11 }}>{r.desc}</div>
                </div>
                <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>{r.default}</div>
              </div>
            ))}
            <div className="text-muted text-xs mt-2 mb-1" style={{ letterSpacing: "0.08em" }}>APP-LAYER GUARDS (OWS daily_total tracks ETH only, not ERC-20)</div>
            {[
              { env: "MAX_DAILY_USDC",            default: "100", desc: "USDC daily cap" },
              { env: "OWS_MAX_TX_PER_DAY",        default: "20",  desc: "Transaction count limit" },
              { env: "OWS_COOLDOWN_SECONDS",      default: "30",  desc: "Seconds between transactions" },
              { env: "OWS_MAX_PER_ADDRESS_DAILY", default: "50",  desc: "Max per recipient per day" },
              { env: "OWS_CONFIRM_ABOVE_USDC",    default: "25",  desc: "Confirmation threshold" },
            ].map((r) => (
              <div key={r.env} className="term-card" style={{ padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                    { mod: "@open-wallet-standard/core", role: "Wallet · Policy · Signing", note: "native: chain allowlist + expiry; app-layer: spend guards" },
                    { mod: "@x402/next · @x402/fetch",   role: "Paid Capabilities",          note: "optional commerce layer for selling and buying agent services" },
                    { mod: "Li.Fi REST API",             role: "Cross-chain Bridge",        note: "17+ EVM chains, no API key needed" },
                    { mod: "@honcho-ai/sdk",             role: "Personalized Memory",       note: "User habits, named contacts, spending history" },
                    { mod: "Zerion REST API",            role: "Portfolio · PnL · Txs",     note: "read-only across all chains, OWS partner" },
                    { mod: "Claude / OpenRouter",        role: "Intent Parsing",            note: "Multi-provider: openrouter | anthropic | openai" },
                    { mod: "OpenAI Whisper",             role: "Voice Transcription",       note: "Telegram voice note → text, any language" },
                    { mod: "@xmtp/xmtp-js",             role: "Payment Notifications",     note: "Wallet-native alerts on transfer" },
                    { mod: "MoonPay",                   role: "USDC On-Ramp",              note: "/fund command, direct into OWS wallet" },
                    { mod: "viem",                      role: "Base Client",               note: "TX construction, USDC helpers, Uniswap ABI" },
                    { mod: "grammy",                    role: "Telegram Bot Framework",    note: "Webhook + polling mode" },
                    { mod: "next.js",                   role: "Landing + Webhook API",     note: "App router, /api/webhook route" },
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
          Your DeFi agent awaits.
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 36, lineHeight: 1.8 }}>
          Open Telegram. Type or speak. Watch it settle on Base.<br />
          Self-host your own agent. Add paid capabilities if you want.
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
