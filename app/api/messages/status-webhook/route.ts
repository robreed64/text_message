import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTwilioWebhook } from "@/lib/twilio";
type MessageStatus = "queued" | "sent" | "delivered" | "failed" | "undelivered";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => { params[key] = String(value); });

  const signature = req.headers.get("x-twilio-signature") ?? "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/status-webhook`;
  if (!validateTwilioWebhook(signature, url, params)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const sid = params["MessageSid"];
  const rawStatus = params["MessageStatus"];
  const errorCode = params["ErrorCode"];

  const statusMap: Record<string, MessageStatus> = {
    queued: "queued",
    sent: "sent",
    delivered: "delivered",
    failed: "failed",
    undelivered: "undelivered",
  };

  const status = statusMap[rawStatus];
  if (!status) return new Response("ok");

  await prisma.message.updateMany({
    where: { providerMessageId: sid },
    data: {
      status,
      ...(errorCode && { errorCode }),
    },
  });

  return new Response("ok");
}
