import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendelClient } from "@/lib/vendel";

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
  if (group.members.length === 0) {
    return NextResponse.json({ error: "No eligible recipients (all opted out or group empty)" }, { status: 422 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      groupId,
      body,
      status: "running",
      totalCount: group.members.length,
    },
  });

  const phones = group.members.map(({ contact }) => contact.phone);

  try {
    // Single Vendel API call for all recipients
    const result = await getVendelClient().sendSms(phones, body);

    // Create per-contact message records mapped by index
    const messageRecords = await Promise.all(
      group.members.map(async ({ contact }, i) => {
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
            providerMessageId: result.message_ids[i] ?? null,
            status: "sending",
          },
        });

        await prisma.campaignRecipient.create({
          data: { campaignId: campaign.id, contactId: contact.id, messageId: message.id },
        });

        return message;
      })
    );

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "completed", sentCount: messageRecords.length, completedAt: new Date() },
    });

    return NextResponse.json({
      campaignId: campaign.id,
      batchId: result.batch_id,
      totalCount: result.recipients_count,
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "partial_failure", failedCount: group.members.length, completedAt: new Date() },
    });
    return NextResponse.json({ error: "Failed to send group SMS", detail: error.message }, { status: 502 });
  }
}
