import {
  publicClient,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "../base";
import { getWalletAddress, owsSignAndSend } from "../wallet";
import { encodeFunctionData, parseEther, parseUnits, formatUnits, serializeTransaction } from "viem";

// Uniswap V3 SwapRouter02 on Base
const SWAP_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481" as const;
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as const; // WETH on Base
const POOL_FEE = 500; // 0.05% — ETH/USDC pool fee tier on Base

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

export async function swapETHtoUSDC(ethAmount: string): Promise<string> {
  const ethNum = parseFloat(ethAmount);
  if (isNaN(ethNum) || ethNum <= 0) {
    return `❌ Invalid amount: ${ethAmount}`;
  }

  // Safety limit: max $20 worth (~0.007 ETH at ~$2800)
  if (ethNum > 0.01) {
    return `❌ Safety limit: max 0.01 ETH per swap.`;
  }

  try {
    const from = getWalletAddress() as `0x${string}`;
    const amountIn = parseEther(ethAmount);

    // 2% slippage tolerance — amountOutMinimum = 0 for simplicity (hackathon demo)
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
      to: SWAP_ROUTER,
      data,
      value: amountIn,
    });

    const txHex = serializeTransaction({
      chainId: 8453,
      to: SWAP_ROUTER,
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
      `📤 ${ethAmount} ETH → USDC\n\n` +
      `🔗 [View on Basescan](https://basescan.org/tx/${txHash})`
    );
  } catch (err: any) {
    return `❌ Swap failed: ${err?.message?.slice(0, 120) || "Unknown error"}`;
  }
}

export async function swapUSDCtoETH(usdcAmount: string): Promise<string> {
  const usdcNum = parseFloat(usdcAmount);
  if (isNaN(usdcNum) || usdcNum <= 0) {
    return `❌ Invalid amount: ${usdcAmount}`;
  }
  if (usdcNum > 10) {
    return `❌ Safety limit: max $10 USDC per swap.`;
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

    const swapGas = await publicClient.estimateGas({
      account: from,
      to: SWAP_ROUTER,
      data: swapData,
    });

    const swapTx = serializeTransaction({
      chainId: 8453,
      to: SWAP_ROUTER,
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
      `📤 $${usdcAmount} USDC → ETH\n\n` +
      `🔗 [View on Basescan](https://basescan.org/tx/${swapTxHash})`
    );
  } catch (err: any) {
    return `❌ Swap failed: ${err?.message?.slice(0, 120) || "Unknown error"}`;
  }
}
