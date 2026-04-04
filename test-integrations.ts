#!/usr/bin/env npx tsx
/**
 * Lexon entegrasyon testi — Zerion, Honcho ve Allium bağlantısını kontrol eder.
 * Çalıştır: npx tsx test-integrations.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testZerion() {
  console.log("\n📊 Zerion testi...");
  const key = process.env.ZERION_API_KEY;
  if (!key) { console.log("  ❌ ZERION_API_KEY eksik"); return; }

  const auth = "Basic " + Buffer.from(key + ":").toString("base64");
  // Test adresi: vitalik.eth
  const res = await fetch(
    "https://api.zerion.io/v1/wallets/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/portfolio?currency=usd",
    { headers: { Authorization: auth, Accept: "application/json" } }
  );

  if (!res.ok) {
    console.log(`  ❌ HTTP ${res.status} — key geçersiz veya rate limit`);
    return;
  }

  const data = await res.json();
  const total = data.data?.attributes?.total?.positions?.toFixed(2);
  console.log(`  ✅ Zerion çalışıyor! (test adresi portföyü: $${total})`);
}

async function testHoncho() {
  console.log("\n🧠 Honcho testi...");
  const key = process.env.HONCHO_API_KEY;
  if (!key) { console.log("  ❌ HONCHO_API_KEY eksik"); return; }

  try {
    const { Honcho } = await import("@honcho-ai/sdk");
    const honcho = new Honcho({ apiKey: key, workspaceId: "lexon" });
    const peer = await honcho.peer("test-user");
    const session = await honcho.session(`test-${Date.now()}`);
    await session.addPeers([peer]);
    await session.addMessages([peer.message("merhaba, bu bir test mesajıdır")]);
    console.log("  ✅ Honcho çalışıyor! (mesaj yazıldı)");
  } catch (err: any) {
    console.log(`  ❌ Honcho hatası: ${err?.message?.slice(0, 100)}`);
  }
}

async function testAllium() {
  console.log("\n🧠 Allium testi...");
  const key = process.env.ALLIUM_API_KEY;
  if (!key) { console.log("  ❌ ALLIUM_API_KEY eksik"); return; }

  try {
    const res = await fetch("https://api.allium.so/api/v1/developer/wallet/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": key,
      },
      body: JSON.stringify([
        {
          chain: "base",
          address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        },
      ]),
    });

    if (!res.ok) {
      console.log(`  ❌ HTTP ${res.status} — key geçersiz veya endpoint erişimi yok`);
      return;
    }

    const data = await res.json();
    const count = Array.isArray(data.items) ? data.items.length : 0;
    console.log(`  ✅ Allium çalışıyor! (Base tx kaydı: ${count})`);
  } catch (err: any) {
    console.log(`  ❌ Allium hatası: ${err?.message?.slice(0, 100)}`);
  }
}

async function testLiFi() {
  console.log("\n🌉 Li.Fi testi...");
  try {
    const res = await fetch(
      "https://li.quest/v1/quote?fromChain=8453&toChain=137&fromToken=USDC&toToken=USDC&fromAmount=5000000&fromAddress=0x0000000000000000000000000000000000000001"
    );
    const data = await res.json();
    const tool = data.toolDetails?.name ?? data.tool ?? "?";
    const toAmount = (Number(data.estimate?.toAmount ?? 0) / 1e6).toFixed(2);
    console.log(`  ✅ Li.Fi çalışıyor! (5 USDC → Polygon, ~$${toAmount} USDC via ${tool})`);
  } catch (err: any) {
    console.log(`  ❌ Li.Fi hatası: ${err?.message?.slice(0, 100)}`);
  }
}

async function testOpenRouter() {
  console.log("\n🤖 OpenRouter / AI testi...");
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) { console.log("  ❌ OPENROUTER_API_KEY eksik"); return; }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-6",
        max_tokens: 32,
        messages: [{ role: "user", content: 'Reply with only: {"type":"help"}' }],
      }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    console.log(`  ✅ OpenRouter çalışıyor! (cevap: ${content})`);
  } catch (err: any) {
    console.log(`  ❌ OpenRouter hatası: ${err?.message?.slice(0, 100)}`);
  }
}

async function main() {
  console.log("╔══════════════════════════════════╗");
  console.log("║   Lexon Entegrasyon Testleri     ║");
  console.log("╚══════════════════════════════════╝");

  await testOpenRouter();
  await testZerion();
  await testHoncho();
  await testAllium();
  await testLiFi();

  console.log("\n" + "─".repeat(36));
  console.log("Tüm testler tamamlandı.");
  console.log("✅ olanlar hazır, ❌ olanların key'ini kontrol et.\n");
}

main().catch(console.error);
