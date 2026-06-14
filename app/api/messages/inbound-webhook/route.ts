import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTwilioWebhook, isOptOutMessage } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => { params[key] = String(value); });

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/inbound-webhook`;
  if (!validateTwilioWebhook(signature, url, params)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const fromPhone = params["From"];
  const body = params["Body"] ?? "";
  const providerMessageId = params["MessageSid"];

  const contact = await prisma.contact.findUnique({ where: { phone: fromPhone } });
  if (!contact) {
    // Unknown number — store message without linking
    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }

  // Handle opt-out
  if (isOptOutMessage(body)) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { optedOut: true, optedOutAt: new Date() },
    });
    return new Response(
      "<Response><Message>You have been unsubscribed. Reply START to resubscribe.</Message></Response>",
      { headers: { "Content-Type": "text/xml" } }
    );
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
      providerMessageId,
      status: "delivered",
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
}
