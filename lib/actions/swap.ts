import {
  publicClient,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "../base";
import { getWalletAddress, owsSignAndSend } from "../wallet";
import { encodeFunctionData, parseEther, parseUnits, formatUnits, serializeTransaction } from "viem";
import { config } from "../config";
import { getETHPriceUSD } from "../skills/price";

// DEX Routers on Base mainnet
export const ROUTERS = {
  uniswap_v3:  "0x2626664c2603336E57B271c5C0b26F421741e481" as const, // SwapRouter02
  uniswap_universal: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD" as const, // UniversalRouter
  aerodrome:   "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43" as const,
} as const;

// Default: Uniswap V3 (deepest ETH/USDC liquidity on Base)
const SWAP_ROUTER = ROUTERS.uniswap_v3;
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as const;
const POOL_FEE = 500; // 0.05% — best fee tier for ETH/USDC on Base

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

export async function swapETHtoUSDC(ethAmount: string, dex?: string): Promise<string> {
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
    const router = getRouter(dex);

    const data = encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: WETH_ADDRESS,
          tokenOut: USDC_ADDRESS,
          fee: POOL_FEE,
          recipient: from,
          amountIn,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });

    const [nonce, gasPrice] = await Promise.all([
      publicClient.getTransactionCount({ address: from }),
      publicClient.getGasPrice(),
    ]);

    const gasEstimate = await publicClient.estimateGas({
      account: from,
      to: router,
      data,
      value: amountIn,
    });

    const txHex = serializeTransaction({
      chainId: 8453,
      to: router,
      data,
      nonce,
      gasPrice,
      gas: gasEstimate,
      value: amountIn,
    });

    const txHash = owsSignAndSend(txHex) as `0x${string}`;
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return (
      `✅ *Swap complete!*\n\n` +
      `📤 ${ethAmount} ETH → USDC via ${dexLabel(dex)}\n\n` +
      `🔗 [View on Basescan](https://basescan.org/tx/${txHash})`
    );
  } catch (err: any) {
    return `❌ Swap failed: ${err?.message?.slice(0, 120) || "Unknown error"}`;
  }
}

export async function swapUSDCtoETH(usdcAmount: string, dex?: string): Promise<string> {
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
      args: [SWAP_ROUTER, amountIn],
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
    const swapData = encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: USDC_ADDRESS,
          tokenOut: WETH_ADDRESS,
          fee: POOL_FEE,
          recipient: from,
          amountIn,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });

    const router = getRouter(dex);

    const swapGas = await publicClient.estimateGas({
      account: from,
      to: router,
      data: swapData,
    });

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
      `📤 $${usdcAmount} USDC → ETH via ${dexLabel(dex)}\n\n` +
      `🔗 [View on Basescan](https://basescan.org/tx/${swapTxHash})`
    );
  } catch (err: any) {
    return `❌ Swap failed: ${err?.message?.slice(0, 120) || "Unknown error"}`;
  }
}
