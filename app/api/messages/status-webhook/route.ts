import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVendelWebhook } from "@/lib/vendel";

type StatusPayload = {
  event: "sms_sent" | "sms_delivered" | "sms_failed";
  message_id: string;
  status: string;
  to: string;
  body: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  timestamp: string;
};

const eventToStatus: Record<string, "sent" | "delivered" | "failed"> = {
  sms_sent: "sent",
  sms_delivered: "delivered",
  sms_failed: "failed",
};

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("x-webhook-signature") ?? "";

  if (!verifyVendelWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const payload: StatusPayload = JSON.parse(rawBody.toString());
  const status = eventToStatus[payload.event];
  if (!status) return NextResponse.json({ ok: true });

  await prisma.message.updateMany({
    where: { providerMessageId: payload.message_id },
    data: {
      status,
      ...(payload.error_message && { errorMessage: payload.error_message }),
    },
  });

  return NextResponse.json({ ok: true });
}
