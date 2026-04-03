#!/usr/bin/env node
/**
 * Lexon — OWS Custom Policy Executable
 *
 * OWS pipes a PolicyContext JSON to stdin before every signing operation
 * (agent/API-key mode only). We must write a PolicyResult JSON to stdout.
 *
 * Declarative OWS rules (allowed_chains, expires_at) already ran before us.
 * We handle everything else: contract allowlist, USDC per-tx cap, ETH per-tx cap,
 * and the daily ETH cap that OWS tracks natively in spending.daily_total.
 *
 * PolicyContext schema (relevant fields):
 *   ctx.transaction.to        — recipient address
 *   ctx.transaction.value     — native ETH value in wei (string)
 *   ctx.transaction.data      — calldata hex (ERC-20 transfers carry amount here)
 *   ctx.spending.daily_total  — cumulative ETH wei sent today (OWS-tracked)
 *   ctx.policy_config         — static config injected from policy file
 *
 * PolicyResult: { allow: true } | { allow: false, reason: "..." }
 */

'use strict';

const fs = require('fs');

// ── Read stdin ────────────────────────────────────────────────────────────────
const chunks = [];
process.stdin.on('data', (c) => chunks.push(c));
process.stdin.on('end', () => {
  let ctx;
  try {
    ctx = JSON.parse(Buffer.concat(chunks).toString());
  } catch (e) {
    deny(`Policy parse error: ${e.message}`);
    return;
  }
  try {
    evaluate(ctx);
  } catch (e) {
    deny(`Policy evaluation error: ${e.message}`);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function allow() {
  process.stdout.write(JSON.stringify({ allow: true }) + '\n');
}

function deny(reason) {
  process.stdout.write(JSON.stringify({ allow: false, reason }) + '\n');
}

function formatEth(wei) {
  return (Number(wei) / 1e18).toFixed(6) + ' ETH';
}

// ── Evaluation ────────────────────────────────────────────────────────────────
function evaluate(ctx) {
  const cfg      = ctx.policy_config || {};
  const tx       = ctx.transaction   || {};
  const spending = ctx.spending       || {};

  const to       = (tx.to    || '').toLowerCase();
  const data     = tx.data   || '0x';
  const valueWei = BigInt(tx.value             || '0');
  const dailyWei = BigInt(spending.daily_total || '0');

  // ── 1. Contract allowlist ─────────────────────────────────────────────────
  // Trusted contracts are baked into policy_config at registration time.
  // User-approved contracts are read live from contracts_file so /approve
  // and /unapprove take effect without re-registering the policy.
  const trusted = (cfg.trusted_contracts || []).map((a) => a.toLowerCase());
  let userContracts = [];
  if (cfg.contracts_file) {
    try {
      const raw = fs.readFileSync(cfg.contracts_file, 'utf-8');
      userContracts = Object.keys(JSON.parse(raw)).map((a) => a.toLowerCase());
    } catch {
      // File doesn't exist yet = no user-added contracts
    }
  }
  const allowedContracts = [...new Set([...trusted, ...userContracts])];

  if (allowedContracts.length > 0 && to && !allowedContracts.includes(to)) {
    deny(`Contract not in allowlist: ${to}`);
    return;
  }

  // ── 2. ETH per-tx cap ─────────────────────────────────────────────────────
  const maxEthPerTxWei = BigInt(cfg.max_eth_per_tx_wei || '0');
  if (maxEthPerTxWei > 0n && valueWei > maxEthPerTxWei) {
    deny(`ETH value ${formatEth(valueWei)} exceeds per-tx limit of ${formatEth(maxEthPerTxWei)}`);
    return;
  }

  // ── 3. Daily ETH cap (OWS tracks spending.daily_total natively) ───────────
  const maxDailyEthWei = BigInt(cfg.max_daily_eth_wei || '0');
  if (maxDailyEthWei > 0n && dailyWei + valueWei > maxDailyEthWei) {
    deny(
      `Daily ETH cap reached: ${formatEth(dailyWei)} spent today, ` +
      `limit is ${formatEth(maxDailyEthWei)}`
    );
    return;
  }

  // ── 4. USDC per-tx cap (decode ERC-20 transfer calldata) ─────────────────
  // ERC-20 transfer(address,uint256) selector: 0xa9059cbb
  // Calldata layout (after 0x prefix):
  //   8 hex chars  — function selector
  //   64 hex chars — recipient address (padded to 32 bytes)
  //   64 hex chars — amount (padded to 32 bytes)
  const hex = data.startsWith('0x') ? data.slice(2) : data;
  if (hex.startsWith('a9059cbb') && hex.length >= 8 + 64 + 64) {
    try {
      const amountHex = hex.slice(8 + 64, 8 + 64 + 64);
      const usdcUnits  = BigInt('0x' + amountHex);                      // 6 decimals
      const maxUnits   = BigInt(Math.floor((cfg.max_usdc_per_tx || 100) * 1_000_000));
      if (usdcUnits > maxUnits) {
        const sent  = (Number(usdcUnits) / 1_000_000).toFixed(2);
        const limit = cfg.max_usdc_per_tx || 100;
        deny(`USDC amount $${sent} exceeds per-tx limit of $${limit}`);
        return;
      }
    } catch {
      // Decode error — don't block on malformed data
    }
  }

  allow();
}
