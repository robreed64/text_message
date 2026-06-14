import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { group: { select: { name: true } } },
    }),
    prisma.campaign.count(),
  ]);

  return NextResponse.json({ campaigns, total, page, limit });
}
