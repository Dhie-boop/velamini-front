import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const GRACE_MS = 3 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Block training if credits have been exhausted for more than 3 days
    const usage = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { creditsExhaustedAt: true },
    });
    if (usage?.creditsExhaustedAt && Date.now() > usage.creditsExhaustedAt.getTime() + GRACE_MS) {
      return NextResponse.json({ error: "Training is locked. Your credits ran out. Please top up your plan to continue." }, { status: 403 });
    }

    const body = await req.json();

    // Explicit allowlist of user-editable fields — never pass raw body to Prisma
    const allowedFields = [
      "fullName", "birthDate", "birthPlace", "currentLocation", "languages",
      "bio", "relationshipStatus", "hobbies", "favoriteFood",
      "education", "experience", "skills", "projects", "awards",
      "socialLinks", "socialUpdates", "rawContent",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== null) {
        data[field] = body[field];
      }
    }

    // Upsert knowledge base (update if exists, create if not)
    const knowledgeBase = await prisma.knowledgeBase.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { 
        userId: session.user.id,
        ...data
      },
    });

    return NextResponse.json({ ok: true, knowledgeBase });
  } catch (error: unknown) {
    console.error("training save error:", error);
    return NextResponse.json({ ok: false, error: "Failed to save training data." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ ok: true, knowledgeBase });
  } catch (error: unknown) {
    console.error("training fetch error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch training data." }, { status: 500 });
  }
}
