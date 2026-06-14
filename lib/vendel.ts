import { VendelClient } from "vendel-sdk";
import { createHmac } from "crypto";

let _client: VendelClient | null = null;

export function getVendelClient(): VendelClient {
  if (!_client) {
    _client = new VendelClient({
      baseUrl: process.env.VENDEL_BASE_URL!,
      apiKey: process.env.VENDEL_API_KEY!,
    });
  }
  return _client;
}

export function verifyVendelWebhook(rawBody: Buffer, signature: string): boolean {
  const expected = createHmac("sha256", process.env.VENDEL_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}

const OPT_OUT_KEYWORDS = new Set([
  "stop", "stopall", "unsubscribe", "cancel", "end", "quit",
]);

export function isOptOutMessage(body: string): boolean {
  return OPT_OUT_KEYWORDS.has(body.trim().toLowerCase());
}
