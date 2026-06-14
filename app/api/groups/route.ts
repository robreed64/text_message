import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip = (page - 1) * limit;

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
    prisma.group.count(),
  ]);

  return NextResponse.json({ groups, total, page, limit });
}

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const group = await prisma.group.create({ data: { name, description } });
  return NextResponse.json(group, { status: 201 });
}
