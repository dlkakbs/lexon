import { handleWebhook } from "@/lib/bot";

export async function POST(req: Request) {
  return handleWebhook(req);
}
