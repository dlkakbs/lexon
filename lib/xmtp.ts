// XMTP wallet-to-wallet notifications
// Full integration ready — runtime requires macOS 14+ for native bindings.

export async function notifyRecipient(
  recipientAddress: string,
  amount: string,
  txHash: string
): Promise<void> {
  try {
    // Dynamically import to avoid build-time binding issues
    const { Client } = await import("@xmtp/node-sdk");
    const { privateKeyToAccount } = await import("viem/accounts");

    const privateKey = process.env.XMTP_PRIVATE_KEY;
    if (!privateKey) return;

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    // XMTP v3 Client.create expects a signer object
    const signer = {
      getAddress: () => Promise.resolve(account.address),
      signMessage: (message: string) =>
        account.signMessage({ message }),
    };

    const client = await (Client as any).create(signer, { env: "production" });
    const canMessage = await client.canMessage([recipientAddress]);
    if (!canMessage.get(recipientAddress)) return;

    const conversation = await client.conversations.newDm(recipientAddress);
    await conversation.send(
      `💸 Payment Received via Lexon\n\n` +
      `$${amount} USDC on Base\n` +
      `Tx: https://basescan.org/tx/${txHash}`
    );
  } catch (err) {
    // Best-effort — never block the main tx flow
    console.warn("[XMTP] Notification skipped:", (err as Error).message);
  }
}
