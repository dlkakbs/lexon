import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

async function main() {
  const { getXmtpAgentStatus, startXmtpAgent } = await import("./lib/xmtp/agent");

  console.log("XMTP agent bootstrap starting...");
  console.log(getXmtpAgentStatus());

  await startXmtpAgent();

  console.log("XMTP agent started.");
  console.log(getXmtpAgentStatus());
}

main().catch((error) => {
  console.error("XMTP bootstrap error:", error);
  process.exit(1);
});
