import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST: Save a Q&A pair to the user's knowledge base
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { question, answer } = await req.json();
    if (!question || !answer) {
      return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
    }
    // Fetch or create the user's knowledge base
    let kb = await prisma.knowledgeBase.findUnique({ where: { userId: session.user.id } }) as (typeof prisma.knowledgeBase extends { findUnique: (...args: any) => Promise<infer T> } ? T & { qaPairs?: Array<{ question: string; answer: string }> } : any);
    if (!kb) {
      kb = await prisma.knowledgeBase.create({ data: { userId: session.user.id, trainedPrompt: "", isModelTrained: false, isPubliclyShared: false } }) as (typeof prisma.knowledgeBase extends { create: (...args: any) => Promise<infer T> } ? T & { qaPairs?: Array<{ question: string; answer: string }> } : any);
    }
    // Store Q&A as JSON array in a new field (qaPairs)
    let qaPairs: Array<{ question: string; answer: string }> = [];
    if ((kb as any).qaPairs) {
      qaPairs = (kb as any).qaPairs as Array<{ question: string; answer: string }>;
    }
    qaPairs.push({ question, answer });
    await prisma.knowledgeBase.update({
      where: { userId: session.user.id },
      data: { qaPairs }, // Pass plain JS array/object for JSON field
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save Q&A error:", error);
    return NextResponse.json({ error: "Failed to save Q&A" }, { status: 500 });
  }
}

// GET: Retrieve Q&A pairs for a user (by userId or current user)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    let kb;
    if (userId) {
      kb = await prisma.knowledgeBase.findUnique({ where: { userId } });
    } else {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      kb = await prisma.knowledgeBase.findUnique({ where: { userId: session.user.id } });
    }
    return NextResponse.json({ qaPairs: kb?.qaPairs || [] });
  } catch (error) {
    console.error("Get Q&A error:", error);
    return NextResponse.json({ error: "Failed to get Q&A" }, { status: 500 });
  }
}
