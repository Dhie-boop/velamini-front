import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/swag - Get current user's swag
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const take   = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const swag = await prisma.swag.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const nextCursor = swag.length === take ? swag[swag.length - 1].id : null;
  return NextResponse.json({ swag, nextCursor });
}

// DELETE /api/swag - Delete current user's swag
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.swag.deleteMany({ where: { userId: session.user.id } });
  // Clear shareSlug from KnowledgeBase too
  try {
    await prisma.knowledgeBase.updateMany({
      where: { userId: session.user.id },
      data: { shareSlug: null, isPubliclyShared: false },
    });
  } catch {}
  return NextResponse.json({ ok: true });
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

  // Enforce one swag per user
  const existing = await prisma.swag.findFirst({ where: { userId: session.user.id } });
  if (existing) {
    return NextResponse.json(
      { error: "You already have a swag. Only one is allowed per account." },
      { status: 409 }
    );
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
