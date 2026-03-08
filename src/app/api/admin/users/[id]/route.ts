import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/users/[id]  { status?: string, role?: string }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session.user as any).isAdminAuth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status, role, personalPlanType } = body as { status?: string; role?: string; personalPlanType?: string };

  const allowed = { status: ["active","pending","banned","flagged"], role: ["user","admin"], plan: ["free","plus"] };
  const data: Record<string, unknown> = {};
  if (status          && allowed.status.includes(status))          data.status = status;
  if (role            && allowed.role.includes(role))              data.role   = role;
  if (personalPlanType && allowed.plan.includes(personalPlanType)) {
    data.personalPlanType = personalPlanType;
    // Update limits to match the new plan
    if (personalPlanType === "plus") {
      data.personalMonthlyMsgLimit   = 1500;
      data.personalMonthlyTokenLimit = 1000000;
    } else {
      data.personalMonthlyMsgLimit   = 200;
      data.personalMonthlyTokenLimit = 150000;
    }
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const user = await prisma.user.update({ where: { id }, data });

  // Send a notification to the user when their account status changes
  if (status && ["flagged", "banned", "active"].includes(status)) {
    const notifMap: Record<string, { type: string; title: string; body: string }> = {
      flagged: {
        type: "warning",
        title: "Account flagged",
        body: "Your account has been flagged by our moderation team for review. Some features may be limited during this time. If you believe this is a mistake, please contact support.",
      },
      banned: {
        type: "warning",
        title: "Account suspended",
        body: "Your account has been suspended due to a violation of our terms of service. If you believe this is a mistake, please contact support.",
      },
      active: {
        type: "info",
        title: "Account reinstated",
        body: "Your account has been reviewed and reinstated. You now have full access again. Thank you for your patience.",
      },
    };
    const notif = notifMap[status];
    if (notif) {
      await prisma.notification.create({
        data: { userId: id, type: notif.type, scope: "personal", title: notif.title, body: notif.body },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, user });
}
