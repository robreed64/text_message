import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendelClient, isOptOutMessage } from "@/lib/vendel";

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
  if (isOptOutMessage(body)) {
    return NextResponse.json({ error: "Message body matches an opt-out keyword" }, { status: 400 });
  }

  // Find or create open conversation
  let conversation = await prisma.conversation.findFirst({
    where: { contactId, status: "open" },
    orderBy: { openedAt: "desc" },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { contactId } });
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
    const result = await getVendelClient().sendSms([contact.phone], body);
    const providerMessageId = result.message_ids[0] ?? null;

    await prisma.message.update({
      where: { id: message.id },
      data: { providerMessageId, status: "sending" },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ messageId: message.id, providerMessageId, batchId: result.batch_id });
  } catch (err: unknown) {
    const error = err as { message?: string };
    await prisma.message.update({
      where: { id: message.id },
      data: { status: "failed", errorMessage: error.message },
    });
    return NextResponse.json({ error: "Failed to send SMS", detail: error.message }, { status: 502 });
  }
}
