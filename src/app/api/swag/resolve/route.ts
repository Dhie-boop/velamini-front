import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/swag/resolve?slug=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  // Find swag by slug (kebab-case match)
  const swag = await prisma.swag.findFirst({
    where: {
      content: {
        equals: slug.replace(/-/g, " "),
        mode: "insensitive",
      },
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });
  if (!swag || !swag.user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ userId: swag.user.id, name: swag.user.name, image: swag.user.image });
}
