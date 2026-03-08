import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/moderation?status=&type=&severity=&page=1&pageSize=15
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session.user as any).isAdminAuth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status")   ?? "all";
  const type     = searchParams.get("type")     ?? "all";
  const severity = searchParams.get("severity") ?? "all";
  const page     = Math.max(1, Number(searchParams.get("page")     ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "15")));

  const where: Record<string, unknown> = {};
  if (status   !== "all") where.status   = status;
  if (type     !== "all") where.type     = type;
  if (severity !== "all") where.severity = severity;

  const [total, reports] = await Promise.all([
    prisma.moderationReport.count({ where }),
    prisma.moderationReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        targetUser: { select: { id: true, name: true, email: true, image: true, status: true } },
      },
    }),
  ]);

  const pending = await prisma.moderationReport.count({ where: { status: "pending" } });

  return NextResponse.json({
    ok: true, reports, total, pending,
    page, pageSize, pages: Math.ceil(total / pageSize),
  });
}

// POST /api/admin/moderation  { type, severity, reason, excerpt, reporter, target, targetUserId? }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session.user as any).isAdminAuth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { type, severity, reason, excerpt, reporter, target, targetUserId } = body as {
    type: string; severity?: string; reason: string;
    excerpt?: string; reporter?: string; target?: string; targetUserId?: string;
  };

  if (!type || !reason) return NextResponse.json({ error: "type and reason are required" }, { status: 400 });

  const allowedTypes    = ["message", "profile", "content", "feedback"];
  const allowedSev      = ["high", "medium", "low"];
  if (!allowedTypes.includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const report = await prisma.moderationReport.create({
    data: {
      type,
      severity: allowedSev.includes(severity ?? "") ? severity! : "medium",
      reason,
      excerpt:  excerpt  ?? null,
      reporter: reporter ?? "Admin",
      target:   target   ?? null,
      targetUserId: targetUserId ?? null,
    },
    include: {
      targetUser: { select: { id: true, name: true, email: true, image: true, status: true } },
    },
  });

  return NextResponse.json({ ok: true, report }, { status: 201 });
}
