/**
 * Approved contracts registry — persisted to data/contracts.json.
 * Merged with hardcoded defaults (Uniswap, Aerodrome, Li.Fi) at runtime.
 * Modifiable via /approve and /unapprove bot commands.
 */

import fs from "fs";
import path from "path";

const CONTRACTS_PATH = path.join(process.cwd(), "data", "contracts.json");

// Hardcoded trusted contracts — always present regardless of user config
export const TRUSTED_CONTRACTS: Record<string, string> = {
  "0x2626664c2603336E57B271c5C0b26F421741e481": "Uniswap V3 Router",
  "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD": "Uniswap Universal Router",
  "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43": "Aerodrome Router",
  "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE": "Li.Fi Bridge",
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": "USDC (Base)",
};

function read(): Record<string, string> {
  try {
    if (!fs.existsSync(CONTRACTS_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONTRACTS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function write(data: Record<string, string>) {
  fs.mkdirSync(path.dirname(CONTRACTS_PATH), { recursive: true });
  fs.writeFileSync(CONTRACTS_PATH, JSON.stringify(data, null, 2));
}

export function getAllContracts(): Record<string, string> {
  return { ...TRUSTED_CONTRACTS, ...read() };
}

export function getUserContracts(): Record<string, string> {
  return read();
}

export function isApprovedContract(address: string): boolean {
  const addr = address.toLowerCase();
  const all = getAllContracts();
  return Object.keys(all).some((a) => a.toLowerCase() === addr);
}

export function approveContract(address: string, label: string) {
  const data = read();
  data[address] = label;
  write(data);
}

export function unapproveContract(address: string) {
  const data = read();
  delete data[address];
  write(data);
}
