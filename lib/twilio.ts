import twilio from "twilio";

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER!;

export function validateTwilioWebhook(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}

const OPT_OUT_KEYWORDS = new Set([
  "stop", "stopall", "unsubscribe", "cancel", "end", "quit",
]);

export function isOptOutMessage(body: string): boolean {
  return OPT_OUT_KEYWORDS.has(body.trim().toLowerCase());
}
