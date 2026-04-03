import fs from "fs";
import path from "path";

// Trusted DEX contracts on Base mainnet (hardcoded)
export const TRUSTED_CONTRACTS: Record<string, string> = {
  "0x2626664c2603336E57B271c5C0b26F421741e481": "Uniswap V3 Router",
  "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD": "Uniswap Universal Router",
  "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43": "Aerodrome Router",
};

const ALLOWLIST_PATH = path.join(process.cwd(), "data", "allowlist.json");

function readAllowlist(): Record<string, string> {
  try {
    if (!fs.existsSync(ALLOWLIST_PATH)) return {};
    return JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeAllowlist(list: Record<string, string>) {
  fs.mkdirSync(path.dirname(ALLOWLIST_PATH), { recursive: true });
  fs.writeFileSync(ALLOWLIST_PATH, JSON.stringify(list, null, 2));
}

export function isAllowed(address: string): boolean {
  const addr = address.toLowerCase();
  const trusted = Object.keys(TRUSTED_CONTRACTS).map((a) => a.toLowerCase());
  if (trusted.includes(addr)) return true;

  const personal = readAllowlist();
  return Object.keys(personal).map((a) => a.toLowerCase()).includes(addr);
}

export function addToAllowlist(address: string, label: string = "Kişisel") {
  const list = readAllowlist();
  list[address] = label;
  writeAllowlist(list);
}

export function removeFromAllowlist(address: string) {
  const list = readAllowlist();
  delete list[address];
  writeAllowlist(list);
}

export function getAllowlist(): Record<string, string> {
  return { ...TRUSTED_CONTRACTS, ...readAllowlist() };
}
