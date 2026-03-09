import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session.user as any).isAdminAuth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();

  // Pre-compute all date boundaries
  const monthRanges = Array.from({ length: 7 }, (_, i) => {
    const idx = 6 - i;
    const start = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - idx + 1, 1);
    return { start, end, label: start.toLocaleString("en-US", { month: "short" }) };
  });

  const dayRanges = Array.from({ length: 7 }, (_, i) => {
    const idx = 6 - i;
    const start = new Date(now);
    start.setDate(now.getDate() - idx);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end, label: start.toLocaleString("en-US", { weekday: "short" }) };
  });

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Issue all 25 queries in parallel
  const [
    monthlySignupCounts,
    dailyMessageCounts,
    monthlyMessageCounts,
    totalUsers,
    newThisMonth,
    newLastMonth,
    weekMessages,
    usersWithChats,
  ] = await Promise.all([
    Promise.all(monthRanges.map(r => prisma.user.count({ where: { createdAt: { gte: r.start, lt: r.end } } }))),
    Promise.all(dayRanges.map(r => prisma.message.count({ where: { createdAt: { gte: r.start, lt: r.end } } }))),
    Promise.all(monthRanges.map(r => prisma.message.count({ where: { createdAt: { gte: r.start, lt: r.end } } }))),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.user.count({ where: { createdAt: { gte: prevMonthStart, lt: prevMonthEnd } } }),
    prisma.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { virtualSelfChats: { some: {} } } }),
  ]);

  const monthlySignups = monthRanges.map((r, i) => ({ month: r.label, users: monthlySignupCounts[i] }));
  const dailyMessages  = dayRanges.map((r, i)   => ({ day: r.label, messages: dailyMessageCounts[i] }));
  const monthlyMessages = monthRanges.map((r, i) => ({ month: r.label, messages: monthlyMessageCounts[i] }));

  const rawDelta  = newLastMonth === 0 ? (newThisMonth > 0 ? 100 : 0) : ((newThisMonth - newLastMonth) / newLastMonth * 100);
  const growthPct = (rawDelta >= 0 ? "+" : "") + rawDelta.toFixed(0) + "%";
  const avgMsgPerDay  = weekMessages > 0 ? (weekMessages / 7).toFixed(0) : "0";
  const retentionRate = totalUsers > 0 ? ((usersWithChats / totalUsers) * 100).toFixed(0) + "%" : "0%";

  return NextResponse.json({
    ok: true,
    monthlySignups,
    dailyMessages,
    monthlyMessages,
    metrics: {
      userGrowth:    growthPct,
      avgMsgPerDay,
      retentionRate,
      totalUsers,
    },
  });
}

