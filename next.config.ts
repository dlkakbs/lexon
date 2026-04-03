import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@open-wallet-standard/core",
    "@xmtp/node-sdk",
    "@xmtp/node-bindings",
  ],
};

export default nextConfig;
