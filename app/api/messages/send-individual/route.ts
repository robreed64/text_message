import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { twilioClient, TWILIO_PHONE } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const { contactId, body } = await req.json();

  if (!contactId || !body) {
    return NextResponse.json({ error: "contactId and body are required" }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  if (contact.optedOut) {
    return NextResponse.json({ error: "Contact has opted out" }, { status: 422 });
  }

  // Find or create open conversation
  let conversation = await prisma.conversation.findFirst({
    where: { contactId, status: "open" },
    orderBy: { openedAt: "desc" },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { contactId },
    });
  }

  const message = await prisma.message.create({
    data: {
      senderType: "admin",
      recipientId: contactId,
      conversationId: conversation.id,
      body,
      direction: "outbound",
      status: "queued",
    },
  });

  try {
    const result = await twilioClient.messages.create({
      to: contact.phone,
      from: TWILIO_PHONE,
      body,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/status-webhook`,
    });

    await prisma.message.update({
      where: { id: message.id },
      data: { providerMessageId: result.sid, status: "sent" },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ messageId: message.id, sid: result.sid });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    await prisma.message.update({
      where: { id: message.id },
      data: { status: "failed", errorCode: String(error.code ?? ""), errorMessage: error.message },
    });
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 502 });
  }
}
