import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/swag - Get current user's swag
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const swag = await prisma.swag.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ swag });
}

// POST /api/swag - Create swag for current user
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ error: "Missing swag content" }, { status: 400 });
  }
  // Create swag
  const swag = await prisma.swag.create({
    data: { userId: session.user.id, content },
  });
  // Also ensure user's KnowledgeBase exists and set shareSlug to swag slug (kebab-case)
  const swagSlug = content.trim().replace(/\s+/g, "-").toLowerCase();
  const existingKB = await prisma.knowledgeBase.findUnique({ where: { userId: session.user.id } });
  if (existingKB) {
    await prisma.knowledgeBase.update({
      where: { userId: session.user.id },
      data: { shareSlug: swagSlug },
    });
  } else {
    await prisma.knowledgeBase.create({
      data: { userId: session.user.id, shareSlug: swagSlug },
    });
  }
  return NextResponse.json({ swag });
}
