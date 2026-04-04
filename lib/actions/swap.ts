import {
  publicClient,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "../base";
import { getWalletAddress, owsSignAndSend } from "../wallet";
import { encodeFunctionData, parseEther, parseUnits, serializeTransaction } from "viem";
import { config } from "../config";
import { getETHPriceUSD } from "../skills/price";

// DEX Routers on Base mainnet
export const ROUTERS = {
  uniswap_v3:  "0x2626664c2603336E57B271c5C0b26F421741e481" as const, // SwapRouter02
  uniswap_universal: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD" as const, // UniversalRouter
  aerodrome:   "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43" as const,
} as const;

// Default: Uniswap V3 (deepest ETH/USDC liquidity on Base)
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as const;
const POOL_FEES = [500, 3000, 10000] as const;

const SWAP_ROUTER_ABI = [
  {
    name: "exactInputSingle",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

function getRouter(dex?: string): `0x${string}` {
  if (dex === "aerodrome") return ROUTERS.aerodrome;
  if (dex === "uniswap_universal") return ROUTERS.uniswap_universal;
  return ROUTERS.uniswap_v3;
}

function dexLabel(dex?: string): string {
  if (dex === "aerodrome") return "Aerodrome";
  if (dex === "uniswap_universal") return "Uniswap Universal";
  return "Uniswap V3";
}

function ensureSupportedDex(dex?: string): string | null {
  if (!dex || dex === "uniswap_v3") return null;
  return `❌ ${dexLabel(dex)} swap routing bu build'de henüz aktif değil. Şimdilik Uniswap V3 kullan.`;
}

function buildExactInputSingleData(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  fee: number,
  recipient: `0x${string}`,
  amountIn: bigint
) {
  return encodeFunctionData({
    abi: SWAP_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn,
        tokenOut,
        fee,
        recipient,
        amountIn,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
}

async function findUsableSwapPath(
  from: `0x${string}`,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  value: bigint
) {
  for (const fee of POOL_FEES) {
    try {
      const data = buildExactInputSingleData(tokenIn, tokenOut, fee, from, amountIn);
      const gas = await publicClient.estimateGas({
        account: from,
        to: ROUTERS.uniswap_v3,
        data,
        value,
      });
      return { fee, data, gas };
    } catch {
      continue;
    }
  }

  throw new Error("No supported Uniswap V3 ETH/USDC pool could be estimated on Base.");
}

export async function swapETHtoUSDC(ethAmount: string, dex?: string): Promise<string> {
  const dexError = ensureSupportedDex(dex);
  if (dexError) return dexError;

  const ethNum = parseFloat(ethAmount);
  if (isNaN(ethNum) || ethNum <= 0) {
    return `❌ Invalid amount: ${ethAmount}`;
  }

  // USD bazlı limit: anlık ETH fiyatından hesapla
  const ethPrice = await getETHPriceUSD();
  if (ethPrice > 0) {
    const usdValue = ethNum * ethPrice;
    if (usdValue > config.maxSwapUSD) {
      const maxEthEquiv = (config.maxSwapUSD / ethPrice).toFixed(6);
      return `❌ Limit aşıldı: max $${config.maxSwapUSD} (~${maxEthEquiv} ETH @ $${ethPrice.toFixed(0)}) swap edilebilir.`;
    }
  }

  try {
    const from = getWalletAddress() as `0x${string}`;
    const amountIn = parseEther(ethAmount);

    const [nonce, gasPrice] = await Promise.all([
      publicClient.getTransactionCount({ address: from }),
      publicClient.getGasPrice(),
    ]);

    const { fee, data, gas } = await findUsableSwapPath(
      from,
      WETH_ADDRESS,
      USDC_ADDRESS,
      amountIn,
      amountIn
    );

    const txHex = serializeTransaction({
      chainId: 8453,
      to: ROUTERS.uniswap_v3,
      data,
      nonce,
      gasPrice,
      gas,
      value: amountIn,
    });

    const txHash = owsSignAndSend(txHex) as `0x${string}`;
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return (
      `✅ *Swap complete!*\n\n` +
      `📤 ${ethAmount} ETH → USDC via Uniswap V3 (${fee / 10000}% pool)\n\n` +
      `🔗 [View on Basescan](https://basescan.org/tx/${txHash})`
    );
  } catch (err: any) {
    return `❌ Swap failed: ${err?.message?.slice(0, 120) || "Unknown error"}`;
  }
}

export async function swapUSDCtoETH(usdcAmount: string, dex?: string): Promise<string> {
  const dexError = ensureSupportedDex(dex);
  if (dexError) return dexError;

  const usdcNum = parseFloat(usdcAmount);
  if (isNaN(usdcNum) || usdcNum <= 0) {
    return `❌ Invalid amount: ${usdcAmount}`;
  }
  if (usdcNum > config.maxSwapUSD) {
    return `❌ Limit aşıldı: max $${config.maxSwapUSD} USDC per swap.`;
  }

  try {
    const from = getWalletAddress() as `0x${string}`;
    const amountIn = parseUnits(usdcAmount, USDC_DECIMALS);
    const router = ROUTERS.uniswap_v3;

    // First approve USDC spend
    const USDC_ABI = [
      {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
    ] as const;

    const approveData = encodeFunctionData({
      abi: USDC_ABI,
      functionName: "approve",
      args: [router, amountIn],
    });

    const [nonce, gasPrice] = await Promise.all([
      publicClient.getTransactionCount({ address: from }),
      publicClient.getGasPrice(),
    ]);

    const approveGas = await publicClient.estimateGas({
      account: from,
      to: USDC_ADDRESS,
      data: approveData,
    });

    const approveTx = serializeTransaction({
      chainId: 8453,
      to: USDC_ADDRESS,
      data: approveData,
      nonce,
      gasPrice,
      gas: approveGas,
      value: 0n,
    });

    const approveTxHash = owsSignAndSend(approveTx) as `0x${string}`;
    await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

    // Now swap
    const { fee, data: swapData, gas: swapGas } = await findUsableSwapPath(
      from,
      USDC_ADDRESS,
      WETH_ADDRESS,
      amountIn,
      0n
    );

    const swapTx = serializeTransaction({
      chainId: 8453,
      to: router,
      data: swapData,
      nonce: nonce + 1,
      gasPrice,
      gas: swapGas,
      value: 0n,
    });

    const swapTxHash = owsSignAndSend(swapTx) as `0x${string}`;
    await publicClient.waitForTransactionReceipt({ hash: swapTxHash });

    return (
      `✅ *Swap complete!*\n\n` +
      `📤 $${usdcAmount} USDC → ETH via Uniswap V3 (${fee / 10000}% pool)\n\n` +
      `🔗 [View on Basescan](https://basescan.org/tx/${swapTxHash})`
    );
  } catch (err: any) {
    return `❌ Swap failed: ${err?.message?.slice(0, 120) || "Unknown error"}`;
  }
}
