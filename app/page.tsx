export default function Home() {
  const TELEGRAM_URL = "https://t.me/lexon_bot"; // update after BotFather

  return (
    <div style={{ background: "#3D2C22", minHeight: "100vh", color: "#F5EBE0" }}>

      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid rgba(187,115,75,0.15)" }}
        className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div style={{ background: "#BB734B", width: 32, height: 32, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
            L
          </div>
          <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.02em" }}>Lexon</span>
        </div>
        <div className="hidden md:flex items-center gap-8" style={{ color: "#C4A882", fontSize: 14 }}>
          <a href="#how" style={{ color: "#C4A882" }} className="hover:text-white transition-colors">How it works</a>
          <a href="#features" style={{ color: "#C4A882" }} className="hover:text-white transition-colors">Features</a>
          <a href="#powered" style={{ color: "#C4A882" }} className="hover:text-white transition-colors">Built with</a>
        </div>
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
          className="btn-primary px-5 py-2.5 text-sm">
          Open in Telegram →
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-24 pb-20 flex flex-col lg:flex-row items-center gap-16">

        {/* Left */}
        <div className="flex-1 fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: "rgba(187,115,75,0.12)", border: "1px solid rgba(187,115,75,0.25)", fontSize: 13, color: "#D4956A" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#BB734B", display: "inline-block" }} />
            Live on Base Mainnet
          </div>

          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, lineHeight: 1.1,
            letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
            DeFi in plain{" "}
            <span className="gradient-text">language.</span>
          </h1>

          <p style={{ fontSize: 18, color: "#C4A882", lineHeight: 1.7, maxWidth: 480, marginBottom: "2.5rem" }}>
            Send USDC, check balances, and interact with Base using natural language or voice.
            No wallet setup. No dApp. Just Telegram.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
              className="btn-primary px-8 py-4 text-base flex items-center gap-2">
              <TelegramIcon />
              Start on Telegram
            </a>
            <a href="#how"
              className="btn-ghost px-8 py-4 text-base">
              See how it works
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-10 mt-14" style={{ borderTop: "1px solid rgba(187,115,75,0.15)", paddingTop: "2rem" }}>
            {[
              { val: "Base", label: "Mainnet" },
              { val: "USDC", label: "Native" },
              { val: "Voice", label: "& Text" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#BB734B" }}>{s.val}</div>
                <div style={{ fontSize: 13, color: "#C4A882" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Chat Demo */}
        <div className="flex-1 max-w-sm w-full fade-up-2">
          <div className="chat-demo" style={{ padding: "0" }}>
            {/* Header */}
            <div style={{ background: "#4A3728", padding: "16px 20px",
              borderBottom: "1px solid rgba(187,115,75,0.15)",
              display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#BB734B",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
                L
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Lexon</div>
                <div style={{ fontSize: 12, color: "#BB734B" }}>● online</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="float" style={{ textAlign: "right" }}>
                <span className="msg-user">0x742d...f44e adresine 1.5 USDC gönder</span>
              </div>

              <div className="float-delay">
                <span className="msg-bot">⏳ İşlem hazırlanıyor...</span>
              </div>

              <div className="float-delay2">
                <span className="msg-bot">
                  ✅ <strong>Gönderildi!</strong><br /><br />
                  📤 1.5 USDC → 0x742d...f44e<br /><br />
                  🔗 <span style={{ color: "#BB734B" }}>Basescan'de görüntüle</span>
                </span>
              </div>

              <div className="float" style={{ animationDelay: "1.5s", textAlign: "right" }}>
                <span className="msg-user">Bakiyem ne kadar?</span>
              </div>

              <div className="float-delay">
                <span className="msg-bot">
                  💰 <strong>Wallet Balance</strong><br /><br />
                  USDC: $48.50<br />
                  ETH: 0.002341 ETH
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
            How it works
          </h2>
          <p style={{ color: "#C4A882", fontSize: 16 }}>Three steps. No dApp required.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              icon: "💬",
              title: "Type or speak",
              desc: "Send a text or voice message to Lexon on Telegram in Turkish or English.",
            },
            {
              step: "02",
              icon: "🧠",
              title: "AI understands",
              desc: "Claude parses your intent and routes it to the correct Base action.",
            },
            {
              step: "03",
              icon: "⚡",
              title: "Done on-chain",
              desc: "OWS policy-gated wallet signs and broadcasts the transaction. You get a Basescan link.",
            },
          ].map((item) => (
            <div key={item.step} className="card p-8">
              <div style={{ fontSize: 12, color: "#BB734B", fontWeight: 600, marginBottom: 16,
                letterSpacing: "0.1em" }}>
                STEP {item.step}
              </div>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ color: "#C4A882", fontSize: 14, lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ background: "#2E1F17" }} className="py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
              What you can do
            </h2>
            <p style={{ color: "#C4A882", fontSize: 16 }}>Natural language DeFi on Base.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: "💸",
                title: "Send USDC",
                desc: '"0x742d...f44e adresine 2 USDC gönder"',
                tag: "Transfer",
              },
              {
                icon: "💰",
                title: "Check Balance",
                desc: '"Bakiyem ne kadar?" or "What\'s my balance?"',
                tag: "Query",
              },
              {
                icon: "🎙",
                title: "Voice Commands",
                desc: "Send a voice note — Whisper transcribes it automatically.",
                tag: "Voice",
              },
              {
                icon: "🛡",
                title: "Policy-Gated Safety",
                desc: "OWS enforces max $2/tx and $10/day limits. No surprises.",
                tag: "Security",
              },
              {
                icon: "📩",
                title: "XMTP Notifications",
                desc: "Recipients get wallet-native payment notifications on XMTP.",
                tag: "Messaging",
              },
              {
                icon: "💳",
                title: "Easy On-Ramp",
                desc: "Fund your wallet with MoonPay directly inside Telegram.",
                tag: "On-Ramp",
              },
            ].map((f) => (
              <div key={f.title} className="card p-6 glass-hover">
                <div className="flex items-start justify-between mb-4">
                  <span style={{ fontSize: 28 }}>{f.icon}</span>
                  <span style={{ fontSize: 11, color: "#BB734B", fontWeight: 600,
                    background: "rgba(187,115,75,0.12)", padding: "3px 10px", borderRadius: 20,
                    letterSpacing: "0.05em" }}>
                    {f.tag}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ color: "#C4A882", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built with */}
      <section id="powered" className="max-w-6xl mx-auto px-8 py-24">
        <div className="text-center mb-14">
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#C4A882" }}>
            Built with
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { name: "OWS", desc: "Wallet & Policy" },
            { name: "Base", desc: "L2 Network" },
            { name: "Claude", desc: "Intent AI" },
            { name: "MoonPay", desc: "On-Ramp" },
            { name: "XMTP", desc: "Messaging" },
            { name: "Whisper", desc: "Voice STT" },
            { name: "Telegram", desc: "Interface" },
            { name: "viem", desc: "Base Client" },
          ].map((p) => (
            <div key={p.name} className="card px-6 py-4 text-center" style={{ minWidth: 110 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#F5EBE0" }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "#C4A882", marginTop: 2 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#2E1F17", borderTop: "1px solid rgba(187,115,75,0.15)" }}
        className="py-24">
        <div className="max-w-2xl mx-auto px-8 text-center">
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 700,
            letterSpacing: "-0.02em", marginBottom: 16 }}>
            Try Lexon now
          </h2>
          <p style={{ color: "#C4A882", fontSize: 16, marginBottom: 40, lineHeight: 1.7 }}>
            Open Telegram, send a message, watch it settle on Base.
            No accounts. No downloads. Just a chat.
          </p>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
            className="btn-primary px-10 py-4 text-base inline-flex items-center gap-3">
            <TelegramIcon />
            Open Lexon on Telegram
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(187,115,75,0.1)", color: "#C4A882", fontSize: 13 }}
        className="max-w-6xl mx-auto px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div style={{ background: "#BB734B", width: 22, height: 22, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>
            L
          </div>
          <span>Lexon — OWS Hackathon 2026</span>
        </div>
        <div>Built on Base · Powered by OWS + Claude</div>
      </footer>
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
