import { publicClient, USDC_ADDRESS } from "../base";
import { formatUnits } from "viem";

// Uniswap V3 ETH/USDC pool on Base (0.05% fee)
const POOL_ADDRESS = "0xd0b53D9277642d899DF5C87A3966A349A798F224" as `0x${string}`;

const POOL_ABI = [
  {
    name: "slot0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
  },
] as const;

/** ETH fiyatını sayı olarak döner. Swap limit kontrollerinde kullanılır. */
export async function getETHPriceUSD(): Promise<number> {
  try {
    const slot0 = await publicClient.readContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "slot0",
    });
    const sqrtPriceX96 = slot0[0];
    const Q96 = 2n ** 96n;
    const price =
      (sqrtPriceX96 * sqrtPriceX96 * BigInt(1e6)) /
      (Q96 * Q96 * BigInt(1e18 / 1e6));
    return Number(formatUnits(price, 6));
  } catch {
    return 0;
  }
}

/** ETH fiyatını Uniswap V3 pool'undan çeker (USDC cinsinden) */
export async function getETHPrice(): Promise<string> {
  try {
    const slot0 = await publicClient.readContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "slot0",
    });

    const sqrtPriceX96 = slot0[0];
    // price = (sqrtPriceX96 / 2^96)^2 * (10^6 / 10^18) for USDC(6dec)/ETH(18dec)
    const Q96 = 2n ** 96n;
    const price =
      (sqrtPriceX96 * sqrtPriceX96 * BigInt(1e6)) /
      (Q96 * Q96 * BigInt(1e18 / 1e6));

    // Pool is USDC/ETH so price is USDC per ETH
    const ethPriceUSD = Number(formatUnits(price, 6));

    return (
      `📊 *ETH Fiyatı*\n\n` +
      `**1 ETH = $${ethPriceUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC**\n\n` +
      `_Kaynak: Uniswap V3 Base (anlık)_`
    );
  } catch {
    return "❌ Fiyat alınamadı. Tekrar dene.";
  }
}
