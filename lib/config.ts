/**
 * Lexon user-configurable settings — all read from environment variables.
 * Each person who runs their own Lexon instance sets these in .env.local.
 */
export const config = {
  // OWS wallet
  walletName: process.env.OWS_WALLET_NAME || "lexon-wallet",
  rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",

  // OWS API key — created via setup.ts (ows key create).
  // Agent mode: policy IS enforced. Owner mode (empty): policy is NOT enforced.
  owsApiKey: process.env.OWS_API_KEY || "",

  // OWS policy rules — chains
  // OWS uses eip155:<chainId> format. Add chains where OWS will sign txs.
  allowedChainIds: (process.env.OWS_ALLOWED_CHAINS ||
    // Base + bridge-capable EVM chains
    [
      "eip155:8453",   // Base (primary)
      "eip155:1",      // Ethereum
      "eip155:137",    // Polygon
      "eip155:42161",  // Arbitrum
      "eip155:10",     // Optimism
      "eip155:56",     // BNB Chain
      "eip155:43114",  // Avalanche
      "eip155:324",    // zkSync Era
      "eip155:59144",  // Linea
      "eip155:534352", // Scroll
      "eip155:81457",  // Blast
      "eip155:5000",   // Mantle
      "eip155:130",    // Unichain
    ].join(",")
  ).split(",").map((s) => s.trim()),

  policyExpiry: process.env.OWS_POLICY_EXPIRY || "2027-01-01T00:00:00Z",

  // Approved contract addresses — pre-populated with known DEXes + bridges
  // Users can extend via OWS_ALLOWED_CONTRACTS env (comma-separated)
  allowedContracts: [
    // Base DEXes
    "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap V3 SwapRouter02
    "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", // Uniswap Universal Router
    "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43", // Aerodrome Router
    // Li.Fi bridge router
    "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Li.Fi Diamond
    // USDC on Base (transfer target)
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC Base
    // User-defined extras
    ...(process.env.OWS_ALLOWED_CONTRACTS
      ? process.env.OWS_ALLOWED_CONTRACTS.split(",").map((s) => s.trim())
      : []),
  ],

  // Allowed function selectors — empty = all allowed
  allowedMethods: process.env.OWS_ALLOWED_METHODS
    ? process.env.OWS_ALLOWED_METHODS.split(",").map((s) => s.trim())
    : [],

  // Require confirmation above this USDC amount (0 = never)
  confirmAboveUSDC: parseFloat(process.env.OWS_CONFIRM_ABOVE_USDC || "0"),

  // Spend limits
  // maxEthPerTx: enforced by OWS custom executable (policy/spend_limit.js)
  // maxSendUSDC: enforced by OWS custom executable
  // maxDailyUSDC, maxTxPerDay, cooldownSeconds, maxPerAddressDaily: app-layer
  //   (OWS daily_total tracks ETH value only, not ERC-20 amounts)
  maxEthPerTx: parseFloat(process.env.OWS_MAX_ETH_PER_TX || "0.05"),
  maxSendUSDC: parseFloat(process.env.MAX_SEND_USDC || "100"),
  maxDailyUSDC: parseFloat(process.env.MAX_DAILY_USDC || "100"),
  maxSwapUSD: parseFloat(process.env.MAX_SWAP_USD || "100"),   // applies to both ETH & USDC swaps
  maxSwapUSDC: parseFloat(process.env.MAX_SWAP_USDC || "100"),
  maxTxPerDay: parseInt(process.env.OWS_MAX_TX_PER_DAY || "20"),
  cooldownSeconds: parseInt(process.env.OWS_COOLDOWN_SECONDS || "30"),
  maxPerAddressDaily: parseFloat(process.env.OWS_MAX_PER_ADDRESS_DAILY || "50"),

  // AI model — provider + model string
  // Providers: "openrouter" | "anthropic" | "openai"
  aiProvider: (process.env.AI_PROVIDER || "openrouter") as "openrouter" | "anthropic" | "openai",
  aiModel: process.env.AI_MODEL || "anthropic/claude-sonnet-4-6",

  // MoonPay
  moonpayApiKey: process.env.MOONPAY_API_KEY || "",
  moonpayWalletName: process.env.MOONPAY_WALLET_NAME || "lexon-wallet",
};
