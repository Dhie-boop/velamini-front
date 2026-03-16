import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function resolveAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) return null;
  if (session.user.id) return session.user.id;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email ?? undefined },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = await resolveAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const chat = await prisma.chat.findFirst({
      where: { id: sessionId, userId, isSharedChat: false },
      select: { id: true },
    });

    if (!chat) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.chat.delete({ where: { id: sessionId } });

    return new NextResponse(null, { status: 204 });
  } catch (routeError) {
    console.error("[chat/sessions/delete] failed", routeError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
