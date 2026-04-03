import fs from "fs";
import path from "path";

import { config } from "./config";
import type { Action } from "./intent";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_PATH = path.join(DATA_DIR, "guard-state.json");
const CONFIRM_TTL_MS = 10 * 60 * 1000;

type PendingConfirmation = {
  fingerprint: string;
  expiresAt: number;
};

type GuardState = {
  day: string;
  txCount: number;
  usdcDailyTotal: number;
  perAddressDaily: Record<string, number>;
  lastTxAt: number | null;
  pendingConfirmations: Record<string, PendingConfirmation>;
};

type TransactionGuardInput = {
  kind: "send" | "swap" | "bridge";
  amountUSDC?: number;
  recipient?: string;
};

type GuardResult =
  | { ok: true }
  | { ok: false; message: string };

const INITIAL_STATE = (): GuardState => ({
  day: currentDay(),
  txCount: 0,
  usdcDailyTotal: 0,
  perAddressDaily: {},
  lastTxAt: null,
  pendingConfirmations: {},
});

function currentDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureState(): GuardState {
  try {
    if (!fs.existsSync(STATE_PATH)) return INITIAL_STATE();
    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8")) as Partial<GuardState>;
    const base = INITIAL_STATE();
    const state: GuardState = {
      ...base,
      ...parsed,
      perAddressDaily: parsed.perAddressDaily ?? {},
      pendingConfirmations: parsed.pendingConfirmations ?? {},
    };
    return state.day === currentDay() ? state : INITIAL_STATE();
  } catch {
    return INITIAL_STATE();
  }
}

function saveState(state: GuardState) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${STATE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
  fs.renameSync(tmpPath, STATE_PATH);
}

function pruneExpiredConfirmations(state: GuardState, now: number) {
  for (const [key, pending] of Object.entries(state.pendingConfirmations)) {
    if (pending.expiresAt <= now) {
      delete state.pendingConfirmations[key];
    }
  }
}

function formatUsd(amount: number): string {
  return Number(amount.toFixed(2)).toString();
}

function fingerprintAction(action: Action): string | null {
  switch (action.type) {
    case "send":
      return JSON.stringify({
        type: action.type,
        to: action.to.toLowerCase(),
        amount: action.amount,
        name: action.name ?? "",
      });
    case "swap_eth_usdc":
    case "swap_usdc_eth":
      return JSON.stringify({
        type: action.type,
        amount: action.amount,
        dex: action.dex ?? "",
      });
    case "bridge":
      return JSON.stringify({
        type: action.type,
        fromChain: action.fromChain,
        toChain: action.toChain,
        fromToken: action.fromToken,
        toToken: action.toToken ?? "",
        amount: action.amount,
      });
    default:
      return null;
  }
}

export function enforceTransactionGuards(input: TransactionGuardInput): GuardResult {
  const state = ensureState();
  const now = Date.now();
  pruneExpiredConfirmations(state, now);

  if (config.maxTxPerDay > 0 && state.txCount >= config.maxTxPerDay) {
    return {
      ok: false,
      message: `❌ Günlük işlem limiti doldu: bugün en fazla ${config.maxTxPerDay} işlem yapılabilir.`,
    };
  }

  if (config.cooldownSeconds > 0 && state.lastTxAt) {
    const waitMs = config.cooldownSeconds * 1000 - (now - state.lastTxAt);
    if (waitMs > 0) {
      const waitSeconds = Math.ceil(waitMs / 1000);
      return {
        ok: false,
        message: `⏳ Cooldown aktif. Yeni işlem için ${waitSeconds} saniye bekle.`,
      };
    }
  }

  if (input.amountUSDC && input.amountUSDC > 0) {
    const nextDailyTotal = state.usdcDailyTotal + input.amountUSDC;
    if (config.maxDailyUSDC > 0 && nextDailyTotal > config.maxDailyUSDC) {
      return {
        ok: false,
        message:
          `❌ Günlük USDC limiti aşılır: bugün ${formatUsd(state.usdcDailyTotal)} USDC kullanıldı, ` +
          `limit ${formatUsd(config.maxDailyUSDC)} USDC.`,
      };
    }

    if (input.recipient) {
      const key = input.recipient.toLowerCase();
      const sentToRecipient = state.perAddressDaily[key] ?? 0;
      const nextRecipientTotal = sentToRecipient + input.amountUSDC;
      if (config.maxPerAddressDaily > 0 && nextRecipientTotal > config.maxPerAddressDaily) {
        return {
          ok: false,
          message:
            `❌ Bu adrese günlük limit aşılır: ${key.slice(0, 6)}...${key.slice(-4)} için ` +
            `${formatUsd(sentToRecipient)} / ${formatUsd(config.maxPerAddressDaily)} USDC kullanıldı.`,
        };
      }
    }
  }

  return { ok: true };
}

export function requireHighValueConfirmation(userId: number | undefined, action: Action, amountUSDC?: number): GuardResult {
  if (!userId || !amountUSDC || config.confirmAboveUSDC <= 0 || amountUSDC < config.confirmAboveUSDC) {
    return { ok: true };
  }

  const fingerprint = fingerprintAction(action);
  if (!fingerprint) return { ok: true };

  const state = ensureState();
  const now = Date.now();
  pruneExpiredConfirmations(state, now);

  const confirmationKey = String(userId);
  const pending = state.pendingConfirmations[confirmationKey];
  if (pending && pending.fingerprint === fingerprint && pending.expiresAt > now) {
    delete state.pendingConfirmations[confirmationKey];
    saveState(state);
    return { ok: true };
  }

  state.pendingConfirmations[confirmationKey] = {
    fingerprint,
    expiresAt: now + CONFIRM_TTL_MS,
  };
  saveState(state);

  return {
    ok: false,
    message:
      `⚠️ Bu işlem ${formatUsd(amountUSDC)} USDC olduğu için ek onay istiyor.\n\n` +
      `Aynı komutu 10 dakika içinde tekrar gönderirsen işlem devam edecek.`,
  };
}

export function recordSuccessfulTransaction(input: TransactionGuardInput) {
  const state = ensureState();
  const now = Date.now();
  pruneExpiredConfirmations(state, now);

  state.txCount += 1;
  state.lastTxAt = now;

  if (input.amountUSDC && input.amountUSDC > 0) {
    state.usdcDailyTotal = Number((state.usdcDailyTotal + input.amountUSDC).toFixed(6));
    if (input.recipient) {
      const key = input.recipient.toLowerCase();
      const current = state.perAddressDaily[key] ?? 0;
      state.perAddressDaily[key] = Number((current + input.amountUSDC).toFixed(6));
    }
  }

  saveState(state);
}
