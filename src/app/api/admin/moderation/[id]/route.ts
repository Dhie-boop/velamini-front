import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/moderation/[id]  { status: "resolved" | "dismissed" }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session.user as any).isAdminAuth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json() as { status: string };

  const allowed = ["pending", "resolved", "dismissed"];
  if (!allowed.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const report = await prisma.moderationReport.update({
    where: { id },
    data: {
      status,
      resolvedBy: status !== "pending" ? (session.user as any).email ?? "Admin" : null,
      resolvedAt: status !== "pending" ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, report });
}

// DELETE /api/admin/moderation/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session.user as any).isAdminAuth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.moderationReport.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
