import {
  publicClient,
  USDC_ADDRESS,
  USDC_DECIMALS,
  USDC_ABI,
  getUSDCBalance,
  getETHBalance,
} from "../base";
import { getEip1559Fees } from "../fees";
import { getWalletAddress, owsSignAndSend } from "../wallet";
import { isAllowed } from "../allowlist";
import { isAddress, parseUnits, parseEther, encodeFunctionData, serializeTransaction } from "viem";
import { config } from "../config";

export async function sendUSDC(to: string, amount: string): Promise<string> {
  if (!isAddress(to)) {
    return `❌ Geçersiz adres: \`${to}\``;
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return `❌ Geçersiz miktar: ${amount}`;
  }
  if (amountNum > config.maxSendUSDC) {
    return `❌ Limit aşıldı: tek işlemde max $${config.maxSendUSDC} USDC gönderilebilir.`;
  }

  if (!isAllowed(to)) {
    return (
      `⚠️ *Güvenilmeyen adres*\n\n` +
      `\`${to}\`\n\n` +
      `Bu adres izin listende yok. Göndermek istiyorsan önce şunu yaz:\n` +
      `/izinver ${to}`
    );
  }

  try {
    const from = getWalletAddress() as `0x${string}`;
    const balance = parseFloat(await getUSDCBalance(from));
    if (Number.isFinite(balance) && balance < amountNum) {
      return (
        `❌ Yetersiz USDC bakiyesi.\n\n` +
        `Cüzdandaki USDC: *${balance.toFixed(4)}*\n` +
        `Göndermek istediğin: *${amountNum.toFixed(4)}*\n\n` +
        `Önce ETH → USDC swap yapman gerekiyor.`
      );
    }
    const value = parseUnits(amount, USDC_DECIMALS);

    // Build calldata
    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: "transfer",
      args: [to as `0x${string}`, value],
    });

    // Fetch nonce + gas
    const [nonce, gasEstimate, fees] = await Promise.all([
      publicClient.getTransactionCount({ address: from }),
      publicClient.estimateGas({
        account: from,
        to: USDC_ADDRESS,
        data,
      }),
      getEip1559Fees(),
    ]);

    // Serialize unsigned tx
    const txHex = serializeTransaction({
      type: "eip1559",
      chainId: 8453,
      to: USDC_ADDRESS,
      data,
      nonce,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      gas: gasEstimate,
      value: 0n,
    });

    // OWS signs + broadcasts
    const txHash = owsSignAndSend(txHex) as `0x${string}`;

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return (
      `✅ *Gönderildi!*\n\n` +
      `📤 ${amount} USDC → \`${to.slice(0, 6)}...${to.slice(-4)}\`\n\n` +
      `🔗 [Basescan'de görüntüle](https://basescan.org/tx/${txHash})`
    );
  } catch (err: any) {
    return `❌ İşlem başarısız: ${err?.message?.slice(0, 120) || "Bilinmeyen hata"}`;
  }
}

export async function sendETH(to: string, amount: string): Promise<string> {
  if (!isAddress(to)) {
    return `❌ Geçersiz adres: \`${to}\``;
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return `❌ Geçersiz miktar: ${amount}`;
  }
  if (amountNum > config.maxEthPerTx) {
    return `❌ Limit aşıldı: tek işlemde max ${config.maxEthPerTx} ETH gönderilebilir.`;
  }

  if (!isAllowed(to)) {
    return (
      `⚠️ *Güvenilmeyen adres*\n\n` +
      `\`${to}\`\n\n` +
      `Bu adres izin listende yok. Göndermek istiyorsan önce şunu yaz:\n` +
      `/allow ${to}`
    );
  }

  try {
    const from = getWalletAddress() as `0x${string}`;
    const balance = parseFloat(await getETHBalance(from));
    if (Number.isFinite(balance) && balance < amountNum) {
      return (
        `❌ Yetersiz ETH bakiyesi.\n\n` +
        `Cüzdandaki ETH: *${balance.toFixed(6)}*\n` +
        `Göndermek istediğin: *${amountNum.toFixed(6)}*`
      );
    }

    const value = parseEther(amount);
    const [nonce, gasEstimate, fees] = await Promise.all([
      publicClient.getTransactionCount({ address: from }),
      publicClient.estimateGas({
        account: from,
        to: to as `0x${string}`,
        value,
      }),
      getEip1559Fees(),
    ]);

    const txHex = serializeTransaction({
      type: "eip1559",
      chainId: 8453,
      to: to as `0x${string}`,
      nonce,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      gas: gasEstimate,
      value,
    });

    const txHash = owsSignAndSend(txHex) as `0x${string}`;
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return (
      `✅ *Gönderildi!*\n\n` +
      `📤 ${amount} ETH → \`${to.slice(0, 6)}...${to.slice(-4)}\`\n\n` +
      `🔗 [Basescan'de görüntüle](https://basescan.org/tx/${txHash})`
    );
  } catch (err: any) {
    return `❌ İşlem başarısız: ${err?.message?.slice(0, 120) || "Bilinmeyen hata"}`;
  }
}
