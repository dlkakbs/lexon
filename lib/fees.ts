import { publicClient } from "./base";

export async function getEip1559Fees() {
  const fees = await publicClient.estimateFeesPerGas();

  if (!fees.maxFeePerGas || !fees.maxPriorityFeePerGas) {
    throw new Error("EIP-1559 fees could not be estimated");
  }

  return {
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  };
}
