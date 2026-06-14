import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip = (page - 1) * limit;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { groups: { include: { group: true } } },
    }),
    prisma.contact.count(),
  ]);

  return NextResponse.json({ contacts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
  }

  const existing = await prisma.contact.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
  }

  const contact = await prisma.contact.create({ data: { name, phone } });
  return NextResponse.json(contact, { status: 201 });
}
