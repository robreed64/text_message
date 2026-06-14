import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const members = await prisma.groupMember.findMany({
    where: { groupId: id },
    include: { contact: true },
  });
  return NextResponse.json(members.map((m) => m.contact));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { contactIds } = await req.json();

  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    return NextResponse.json({ error: "contactIds array required" }, { status: 400 });
  }

  await prisma.groupMember.createMany({
    data: contactIds.map((contactId: string) => ({ groupId: id, contactId })),
    skipDuplicates: true,
  });

  return NextResponse.json({ success: true });
}
