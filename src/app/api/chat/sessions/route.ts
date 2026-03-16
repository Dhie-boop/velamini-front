import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function resolveAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    return null;
  }

  if (session.user.id) {
    return session.user.id;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email ?? undefined },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "20"), 1), 50);
    const page = Math.max(Number(url.searchParams.get("page") ?? "1"), 1);
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.chat.findMany({
        where: { userId, isSharedChat: false },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { role: true, content: true, createdAt: true },
          },
        },
      }),
      prisma.chat.count({ where: { userId, isSharedChat: false } }),
    ]);

    return NextResponse.json({
      sessions: sessions.map((session) => ({
        sessionId: session.id,
        title: (session.messages[0]?.content ?? "New chat").slice(0, 80),
        messageCount: session._count.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastMessage: session.messages[0] ?? null,
      })),
      total,
      page,
      limit,
    });
  } catch (routeError) {
    console.error("[chat/sessions] failed", routeError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
