import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

type AdminSessionLike = {
  user?: {
    id?: string;
    isAdminAuth?: boolean;
  };
} | null;

function isAdminSession(session: AdminSessionLike): boolean {
  return Boolean(session?.user?.id && (session.user as { isAdminAuth?: boolean }).isAdminAuth);
}

const billingQuerySchema = z.object({
  type: z.enum(["org", "user", "all"]).default("all"),
  status: z.enum(["success", "pending", "failed", "all"]).default("all"),
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(15),
});

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set-record-status"),
    kind: z.enum(["org", "user"]),
    id: z.string().min(1),
    status: z.enum(["success", "pending", "failed"]),
  }),
  z.object({
    action: z.literal("set-org-plan"),
    orgId: z.string().min(1),
    plan: z.enum(["free", "starter", "pro", "scale"]),
  }),
  z.object({
    action: z.literal("set-user-plan"),
    userId: z.string().min(1),
    plan: z.enum(["free", "plus"]),
  }),
]);

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/billing
 *
 * Returns paginated billing records for both org and personal plans.
 * Query params:
 *   type    = "org" | "user" | "all"   (default "all")
 *   status  = "success" | "pending" | "failed" | "all"
 *   search  = name / email substring
 *   page    = 1-based page number
 *   pageSize
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const parsed = billingQuerySchema.safeParse({
      type: searchParams.get("type") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 });
    }
    const { type, status, search, page, pageSize } = parsed.data;

    // ── Summary stats ──────────────────────────────────────────────────────

  const [
    orgRevenue,
    userRevenue,
    orgPending,
    userPending,
    orgFailed,
    userFailed,
    orgActivePlans,
    userActivePlans,
  ] = await Promise.all([
    prisma.billingRecord.aggregate({ _sum: { amountRWF: true }, where: { status: "success" } }),
    prisma.userBillingRecord.aggregate({ _sum: { amountRWF: true }, where: { status: "success" } }),
    prisma.billingRecord.count({ where: { status: "pending" } }),
    prisma.userBillingRecord.count({ where: { status: "pending" } }),
    prisma.billingRecord.count({ where: { status: "failed" } }),
    prisma.userBillingRecord.count({ where: { status: "failed" } }),
    prisma.organization.count({ where: { planType: { not: "free" } } }),
    prisma.user.count({ where: { personalPlanType: { not: "free" } } }),
  ]);

  const stats = {
    totalRevenue:   (orgRevenue._sum.amountRWF ?? 0) + (userRevenue._sum.amountRWF ?? 0),
    orgRevenue:      orgRevenue._sum.amountRWF ?? 0,
    userRevenue:     userRevenue._sum.amountRWF ?? 0,
    pendingCount:    orgPending + userPending,
    failedCount:     orgFailed + userFailed,
    activePaidOrgs:  orgActivePlans,
    activePaidUsers: userActivePlans,
  };

    // ── Org billing records ────────────────────────────────────────────────

    const orgWhere: Prisma.BillingRecordWhereInput = {};
    if (status !== "all") orgWhere.status = status;
    if (search) {
      orgWhere.OR = [
        { organization: { name: { contains: search, mode: "insensitive" } } },
        { organization: { contactEmail: { contains: search, mode: "insensitive" } } },
        { organization: { owner: { email: { contains: search, mode: "insensitive" } } } },
      ];
    }

    // ── User billing records ───────────────────────────────────────────────

    const userWhere: Prisma.UserBillingRecordWhereInput = {};
    if (status !== "all") userWhere.status = status;
    if (search) {
      userWhere.OR = [
        { user: { name:  { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // ── Fetch based on type filter ─────────────────────────────────────────

  const skip = (page - 1) * pageSize;

    if (type === "org") {
    const [total, records] = await Promise.all([
      prisma.billingRecord.count({ where: orgWhere }),
      prisma.billingRecord.findMany({
        where: orgWhere,
        orderBy: { createdAt: "desc" },
        skip, take: pageSize,
        include: {
          organization: {
            select: { id: true, name: true, contactEmail: true, planType: true,
              owner: { select: { id: true, name: true, email: true } } },
          },
        },
      }),
    ]);
    const rows = records.map(r => ({
      id: r.id, kind: "org" as const,
      entityId:   r.organization.id,
      entityName: r.organization.name,
      entityEmail: r.organization.contactEmail ?? r.organization.owner?.email ?? "",
      plan:      r.plan,
      amountRWF: r.amountRWF,
      txRef:     r.txRef,
      flwRef:    r.flwRef ?? null,
      status:    r.status,
      createdAt: r.createdAt.toISOString(),
    }));
      return NextResponse.json({ ok: true, stats, records: rows, total, page, pages: Math.ceil(total / pageSize) });
    }

    if (type === "user") {
    const [total, records] = await Promise.all([
      prisma.userBillingRecord.count({ where: userWhere }),
      prisma.userBillingRecord.findMany({
        where: userWhere,
        orderBy: { createdAt: "desc" },
        skip, take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true, personalPlanType: true } },
        },
      }),
    ]);
    const rows = records.map(r => ({
      id: r.id, kind: "user" as const,
      entityId:    r.user.id,
      entityName:  r.user.name ?? "User",
      entityEmail: r.user.email ?? "",
      plan:      r.plan,
      amountRWF: r.amountRWF,
      txRef:     r.txRef,
      flwRef:    r.flwRef ?? null,
      status:    r.status,
      createdAt: r.createdAt.toISOString(),
    }));
      return NextResponse.json({ ok: true, stats, records: rows, total, page, pages: Math.ceil(total / pageSize) });
    }

    // type === "all" — merge both, ordered by createdAt desc
    const [orgTotal, userTotal, orgRecords, userRecords] = await Promise.all([
    prisma.billingRecord.count({ where: orgWhere }),
    prisma.userBillingRecord.count({ where: userWhere }),
    prisma.billingRecord.findMany({
      where: orgWhere,
      orderBy: { createdAt: "desc" },
      take: 200,      // fetch enough to merge-sort
      include: {
        organization: {
          select: { id: true, name: true, contactEmail: true, planType: true,
            owner: { select: { id: true, name: true, email: true } } },
        },
      },
    }),
    prisma.userBillingRecord.findMany({
      where: userWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true, personalPlanType: true } },
      },
    }),
  ]);

    const merged = [
    ...orgRecords.map(r => ({
      id: r.id, kind: "org" as const,
      entityId:    r.organization.id,
      entityName:  r.organization.name,
      entityEmail: r.organization.contactEmail ?? r.organization.owner?.email ?? "",
      plan:      r.plan,
      amountRWF: r.amountRWF,
      txRef:     r.txRef,
      flwRef:    r.flwRef ?? null,
      status:    r.status,
      createdAt: r.createdAt.toISOString(),
      _ts:       r.createdAt.getTime(),
    })),
    ...userRecords.map(r => ({
      id: r.id, kind: "user" as const,
      entityId:    r.user.id,
      entityName:  r.user.name ?? "User",
      entityEmail: r.user.email ?? "",
      plan:      r.plan,
      amountRWF: r.amountRWF,
      txRef:     r.txRef,
      flwRef:    r.flwRef ?? null,
      status:    r.status,
      createdAt: r.createdAt.toISOString(),
      _ts:       r.createdAt.getTime(),
    })),
  ].sort((a, b) => b._ts - a._ts);

    const total = orgTotal + userTotal;
    const rows  = merged.slice(skip, skip + pageSize);

    return NextResponse.json({ ok: true, stats, records: rows, total, page, pages: Math.ceil(total / pageSize) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/billing
 *
 * Manually override a billing record's status or override a user/org plan.
 * Body:
 *   { action: "set-record-status", kind: "org"|"user", id: string, status: "success"|"pending"|"failed" }
 *   { action: "set-org-plan",  orgId: string, plan: string }
 *   { action: "set-user-plan", userId: string, plan: string }
 */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const { action } = body;

  if (action === "set-record-status") {
    const { kind, id, status } = body;
    if (kind === "org") {
      await prisma.billingRecord.update({ where: { id }, data: { status } });
    } else {
      await prisma.userBillingRecord.update({ where: { id }, data: { status } });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "set-org-plan") {
    const { orgId, plan } = body;
    const LIMITS: Record<string, number> = { free: 500, starter: 2000, pro: 8000, scale: 25000 };
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        planType:            plan,
        monthlyMessageLimit: LIMITS[plan] ?? 500,
        planRenewalDate:     plan === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "set-user-plan") {
    const { userId, plan } = body;
    const LIMITS: Record<string, number> = { free: 200, plus: 1500 };
    await prisma.user.update({
      where: { id: userId },
      data: {
        personalPlanType:        plan,
        personalMonthlyMsgLimit: LIMITS[plan] ?? 200,
        personalPlanRenewalDate: plan === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
