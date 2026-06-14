import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  await prisma.groupMember.delete({
    where: { groupId_contactId: { groupId: id, contactId } },
  });
  return NextResponse.json({ success: true });
}
