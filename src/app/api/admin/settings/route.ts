import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

const DEFAULTS: Record<string, string> = {
  allowSignups:       "true",
  requireEmailVerify: "true",
  maintenanceMode:    "false",
  aiEnabled:          "true",
  moderationAI:       "true",
  emailNotifs:        "true",
  slackNotifs:        "false",
  publicProfiles:     "true",
  analyticsTracking:  "true",
  rateLimit:          "100",
  maxQaPairs:         "500",
  platformName:       "Velamini",
  supportEmail:       "support@velamini.com",
};

function isAdmin(session: Session | null): boolean {
  return (session?.user as any)?.isAdminAuth === true;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.platformSetting.findMany();
  const saved: Record<string, string> = {};
  for (const r of rows) saved[r.key] = r.value;

  // Merge DB values over defaults
  const settings = { ...DEFAULTS, ...saved };
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as Record<string, unknown>;

  // Upsert each key
  await Promise.all(
    Object.entries(body).map(([key, val]) =>
      prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(val) },
        create: { key, value: String(val) },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
