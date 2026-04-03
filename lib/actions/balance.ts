import { getUSDCBalance, getETHBalance } from "../base";

export async function checkBalance(address: string): Promise<string> {
  const addr = address as `0x${string}`;
  const [usdc, eth] = await Promise.all([
    getUSDCBalance(addr),
    getETHBalance(addr),
  ]);

  const usdcNum = parseFloat(usdc);
  const ethNum = parseFloat(eth);

  return (
    `💰 *Wallet Balance*\n` +
    `\`${address.slice(0, 6)}...${address.slice(-4)}\`\n\n` +
    `USDC: $${usdcNum.toFixed(2)}\n` +
    `ETH: ${ethNum.toFixed(6)} ETH`
  );
}
