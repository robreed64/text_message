import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVendelWebhook, isOptOutMessage } from "@/lib/vendel";

type SmsReceivedPayload = {
  event: "sms_received";
  from: string;
  body: string;
  message_id: string;
  timestamp: string;
};

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("x-webhook-signature") ?? "";

  if (!verifyVendelWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const payload: SmsReceivedPayload = JSON.parse(rawBody.toString());
  if (payload.event !== "sms_received") {
    return NextResponse.json({ ok: true });
  }

  const { from, body, message_id } = payload;

  const contact = await prisma.contact.findUnique({ where: { phone: from } });
  if (!contact) return NextResponse.json({ ok: true });

  // Handle opt-out
  if (isOptOutMessage(body)) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { optedOut: true, optedOutAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  // Find or open conversation
  let conversation = await prisma.conversation.findFirst({
    where: { contactId: contact.id, status: "open" },
    orderBy: { lastMessageAt: "desc" },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { contactId: contact.id } });
  }

  // Find thread root (most recent outbound in this conversation)
  const threadRoot = await prisma.message.findFirst({
    where: { conversationId: conversation.id, direction: "outbound" },
    orderBy: { createdAt: "desc" },
  });

  await prisma.message.create({
    data: {
      senderType: "contact",
      senderId: contact.id,
      conversationId: conversation.id,
      body,
      direction: "inbound",
      threadRootId: threadRoot?.id ?? null,
      providerMessageId: message_id,
      status: "delivered",
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
