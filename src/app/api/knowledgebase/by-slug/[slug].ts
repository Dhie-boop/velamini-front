import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/knowledgebase/by-slug/[slug]
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    // Find knowledge base by shareSlug
    const kb = await prisma.knowledgeBase.findUnique({
      where: { shareSlug: slug },
      select: { userId: true },
    });
    if (!kb) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ userId: kb.userId });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
