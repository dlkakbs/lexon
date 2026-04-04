const DEFAULT_DB_PATH = "./data/xmtp";

type XmtpEnv = "local" | "dev" | "production";

export const xmtpConfig = {
  env: ((process.env.XMTP_ENV as XmtpEnv | undefined) || "dev") as XmtpEnv,
  walletKey: process.env.XMTP_WALLET_KEY || "",
  dbEncryptionKey: process.env.XMTP_DB_ENCRYPTION_KEY || "",
  dbPath: process.env.XMTP_DB_PATH || DEFAULT_DB_PATH,
  groupId: process.env.XMTP_GROUP_ID || "",
};

export function isXmtpConfigured(): boolean {
  return Boolean(xmtpConfig.walletKey && xmtpConfig.dbEncryptionKey);
}

export function getXmtpMissingConfig(): string[] {
  const missing: string[] = [];

  if (!xmtpConfig.walletKey) missing.push("XMTP_WALLET_KEY");
  if (!xmtpConfig.dbEncryptionKey) missing.push("XMTP_DB_ENCRYPTION_KEY");

  return missing;
}
