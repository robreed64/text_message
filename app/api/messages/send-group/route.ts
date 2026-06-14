import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { twilioClient, TWILIO_PHONE } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const { groupId, body } = await req.json();

  if (!groupId || !body) {
    return NextResponse.json({ error: "groupId and body are required" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { contact: true },
        where: { contact: { optedOut: false } },
      },
    },
  });

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const campaign = await prisma.campaign.create({
    data: {
      groupId,
      body,
      status: "running",
      totalCount: group.members.length,
    },
  });

  // Send asynchronously — fire and update campaign in background
  // In production this would be enqueued via Vercel Queues
  let sentCount = 0;
  let failedCount = 0;

  const sends = group.members.map(async ({ contact }) => {
    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id, status: "open" },
      orderBy: { openedAt: "desc" },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({ data: { contactId: contact.id } });
    }

    const message = await prisma.message.create({
      data: {
        senderType: "admin",
        recipientId: contact.id,
        groupId,
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

      await prisma.campaignRecipient.create({
        data: { campaignId: campaign.id, contactId: contact.id, messageId: message.id },
      });

      sentCount++;
    } catch {
      await prisma.message.update({
        where: { id: message.id },
        data: { status: "failed" },
      });
      failedCount++;
    }
  });

  // Respond immediately; let sends complete in background (Vercel Fluid Compute keeps alive)
  Promise.all(sends).then(async () => {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: failedCount > 0 && sentCount === 0 ? "partial_failure" : "completed",
        sentCount,
        failedCount,
        completedAt: new Date(),
      },
    });
  });

  return NextResponse.json({ campaignId: campaign.id, totalCount: group.members.length });
}
