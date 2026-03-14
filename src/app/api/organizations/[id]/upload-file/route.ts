

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest, context: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  let orgId: string | undefined;
  if (typeof (context.params as any)?.then === 'function') {
    const params = await (context.params as Promise<{ id: string }>);
    orgId = params?.id;
  } else {
    orgId = (context.params as { id: string })?.id;
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json({ error: "Organization ID not found in params." }, { status: 400 });
  }
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "uploads", orgId);
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, file.name);
  await fs.writeFile(filePath, buffer);
  // TODO: Trigger AI training on filePath
  return NextResponse.json({ ok: true, file: file.name });
}
