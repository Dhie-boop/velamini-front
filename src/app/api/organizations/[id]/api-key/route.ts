import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/organizations/[id]/api-key
 * Rotate (or generate) the organisation's API key.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const org = await prisma.organization.findFirst({
      where: { id, ownerId: session.user.id },
      select: { id: true },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { randomUUID } = await import("crypto");
    const apiKey = `vela_${randomUUID().replace(/-/g, "")}`;

    await prisma.organization.update({
      where: { id },
      data: { apiKey },
    });

    return NextResponse.json({ ok: true, apiKey });
  } catch (error) {
    console.error("Rotate API key error:", error);
    return NextResponse.json({ error: "Failed to rotate API key" }, { status: 500 });
  }
}
