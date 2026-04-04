import {
  publicClient,
  USDC_ADDRESS,
  USDC_DECIMALS,
  USDC_ABI,
} from "../base";
import { getWalletAddress, owsSignAndSend } from "../wallet";
import { isAllowed } from "../allowlist";
import { isAddress, parseUnits, encodeFunctionData, serializeTransaction } from "viem";
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
    const value = parseUnits(amount, USDC_DECIMALS);

    // Build calldata
    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: "transfer",
      args: [to as `0x${string}`, value],
    });

    // Fetch nonce + gas
    const [nonce, gasPrice, gasEstimate] = await Promise.all([
      publicClient.getTransactionCount({ address: from }),
      publicClient.getGasPrice(),
      publicClient.estimateGas({
        account: from,
        to: USDC_ADDRESS,
        data,
      }),
    ]);

    // Serialize unsigned tx
    const txHex = serializeTransaction({
      chainId: 8453,
      to: USDC_ADDRESS,
      data,
      nonce,
      gasPrice,
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
