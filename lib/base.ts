import { createPublicClient, http, parseUnits, formatUnits } from "viem";
import { base } from "viem/chains";

// Base mainnet USDC contract
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const USDC_DECIMALS = 6;

export const UNISWAP_V3_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481" as const;

export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
});

export const USDC_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export async function getUSDCBalance(address: `0x${string}`): Promise<string> {
  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [address],
  });
  return formatUnits(balance, USDC_DECIMALS);
}

export async function getETHBalance(address: `0x${string}`): Promise<string> {
  const balance = await publicClient.getBalance({ address });
  return formatUnits(balance, 18);
}

export async function buildUSDCSendTx(
  from: `0x${string}`,
  to: `0x${string}`,
  amountUSDC: string
) {
  const amount = parseUnits(amountUSDC, USDC_DECIMALS);
  const { request } = await publicClient.simulateContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "transfer",
    args: [to, amount],
    account: from,
  });
  return request;
}
