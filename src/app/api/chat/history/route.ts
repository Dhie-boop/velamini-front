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
    const sessionId = url.searchParams.get("sessionId")?.trim();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId query parameter" }, { status: 400 });
    }

    const chat = await prisma.chat.findFirst({
      where: { id: sessionId, userId, isSharedChat: false },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: chat.id,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: chat.messages.length,
      messages: chat.messages,
    });
  } catch (routeError) {
    console.error("[chat/history] failed", routeError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
