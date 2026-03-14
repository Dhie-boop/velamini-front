
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json({ error: "Organization ID not found in params." }, { status: 400 });
  }
  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }
  // TODO: Fetch and analyze website content, then trigger AI training
  return NextResponse.json({ ok: true, url });
}
