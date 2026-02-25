import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    // Unwrap params if it's a Promise (App Router dynamic API route)
    const params = await context.params;
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    // Find knowledge base by shareSlug and return associated user's name and image
    const kb = await prisma.knowledgeBase.findUnique({
      where: { shareSlug: slug },
      select: {
        user: {
          select: { name: true, image: true }
        }
      }
    });
    if (!kb || !kb.user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ name: kb.user.name, image: kb.user.image });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
