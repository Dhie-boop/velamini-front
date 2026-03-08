import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardWrapper from "@/components/dashboard/DashboardWrapper";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get user ID - fallback to email lookup if ID is missing
  let userId: string | undefined = session.user.id;
  let user = null;

  if (!userId && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, accountType: true, status: true },
    });
    userId = user?.id;
  } else if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, accountType: true, status: true },
    });
  }

  if (!userId || !user) {
    redirect("/auth/signin");
  }

  // Redirect organization accounts to their dashboard (for future use)
  if (user.accountType === "organization") {
    redirect("/Dashboard/organizations");
  }

  // Fetch personal usage for the navbar pill (server-side so it shows immediately)
  const usageData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      personalPlanType:          true,
      personalMonthlyMsgCount:   true,
      personalMonthlyMsgLimit:   true,
      personalMonthlyTokenCount: true,
      personalMonthlyTokenLimit: true,
      creditsExhaustedAt:        true,
    },
  });

  const GRACE_MS = 3 * 24 * 60 * 60 * 1000;
  const exhaustedMs  = usageData?.creditsExhaustedAt?.getTime() ?? null;
  const graceEndsMs  = exhaustedMs ? exhaustedMs + GRACE_MS : null;
  const nowMs        = Date.now();
  const hardBlocked  = graceEndsMs !== null && nowMs > graceEndsMs;
  const graceRemaining = graceEndsMs && !hardBlocked
    ? Math.ceil((graceEndsMs - nowMs) / (24 * 60 * 60 * 1000))
    : null;

  const initialUsage = {
    planType:     usageData?.personalPlanType ?? "free",
    msgCount:     usageData?.personalMonthlyMsgCount   ?? 0,
    msgLimit:     usageData?.personalMonthlyMsgLimit   ?? 200,
    tokenCount:   usageData?.personalMonthlyTokenCount ?? 0,
    tokenLimit:   usageData?.personalMonthlyTokenLimit ?? 150_000,
    hardBlocked,
    graceRemaining,
  };

  // Check if user has knowledge base
  const knowledgeBase = await prisma.knowledgeBase.findUnique({
    where: { userId },
  });

  // Calculate completion based on structured fields
  const hasIdentity = !!(knowledgeBase?.fullName || knowledgeBase?.birthDate || knowledgeBase?.bio);
  const hasEducation = !!knowledgeBase?.education;
  const hasExperience = !!knowledgeBase?.experience;
  const hasSkills = !!knowledgeBase?.skills;
  const hasProjects = !!knowledgeBase?.projects;

  const completedSections = [hasIdentity, hasEducation, hasExperience, hasSkills, hasProjects].filter(Boolean).length;

  const stats = {
    trainingEntries: knowledgeBase ? 1 : 0,
    qaPairs: 0, // Reserved for future chat training
    personalityTraits: hasIdentity ? 1 : 0,
    knowledgeItems: completedSections,
  };

  // Serialize dates for client component
  const serializedKnowledgeBase = knowledgeBase ? {
    ...knowledgeBase,
    createdAt: knowledgeBase.createdAt.toISOString(),
    updatedAt: knowledgeBase.updatedAt.toISOString(),
    lastTrainedAt: knowledgeBase.lastTrainedAt?.toISOString() || null,
  } : null;

  const userWithStatus = { ...session.user, status: (user as any)?.status ?? "active" };
  return <DashboardWrapper user={userWithStatus} stats={stats} knowledgeBase={serializedKnowledgeBase} initialUsage={initialUsage}/>;
}
