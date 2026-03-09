import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type AdminSessionLike = {
  user?: {
    id?: string;
    isAdminAuth?: boolean;
  };
} | null;

function isAdminSession(session: AdminSessionLike): boolean {
  return Boolean(session?.user?.id && (session.user as { isAdminAuth?: boolean }).isAdminAuth);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, prevTotalUsers,
    trainedCount, prevTrainedCount,
    totalMessages, prevTotalMessages,
    activeThisWeek, activePrevWeek,
    totalOrgs, prevTotalOrgs,
    totalOrgChats, prevTotalOrgChats,
    totalDataAnalyses, prevTotalDataAnalyses,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { lt: weekAgo } } }),
    prisma.knowledgeBase.count({ where: { isModelTrained: true } }),
    prisma.knowledgeBase.count({ where: { isModelTrained: true, lastTrainedAt: { lt: weekAgo } } }),
    prisma.message.count(),
    prisma.message.count({ where: { createdAt: { lt: weekAgo } } }),
    prisma.chat.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: weekAgo }, userId: { not: null } },
    }).then(r => r.length),
    prisma.chat.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: prevWeekStart, lt: weekAgo }, userId: { not: null } },
    }).then(r => r.length),
    prisma.organization.count(),
    prisma.organization.count({ where: { createdAt: { lt: weekAgo } } }),
    prisma.chat.count({ where: { organizationId: { not: null } } }),
    prisma.chat.count({ where: { organizationId: { not: null }, createdAt: { lt: weekAgo } } }),
    prisma.dataAnalysis.count(),
    prisma.dataAnalysis.count({ where: { createdAt: { lt: weekAgo } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, image: true, createdAt: true, status: true },
    }),
  ]);

  const pct = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const delta = ((current - previous) / previous) * 100;
    return (delta >= 0 ? "+" : "") + delta.toFixed(0) + "%";
  };

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers:       { value: totalUsers,       delta: pct(totalUsers,       prevTotalUsers)       },
        trainingSessions: { value: trainedCount,      delta: pct(trainedCount,     prevTrainedCount)     },
        totalMessages:    { value: totalMessages,     delta: pct(totalMessages,    prevTotalMessages)    },
        activeThisWeek:   { value: activeThisWeek,    delta: pct(activeThisWeek,   activePrevWeek)       },
        totalOrgs:        { value: totalOrgs,         delta: pct(totalOrgs,        prevTotalOrgs)        },
        totalOrgChats:    { value: totalOrgChats,     delta: pct(totalOrgChats,    prevTotalOrgChats)    },
        totalDataAnalyses:{ value: totalDataAnalyses, delta: pct(totalDataAnalyses,prevTotalDataAnalyses)},
      },
      recentUsers,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
