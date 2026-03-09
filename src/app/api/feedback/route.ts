import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { rating, comment, virtualSelfSlug } = await req.json();

    if (!rating || typeof rating !== "number") {
      return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        rating,
        comment,
        userId: session?.user?.id ?? null,
        virtualSelfSlug: virtualSelfSlug ?? null,
      },
    });
    console.log("Feedback saved:", feedback.id, "user:", session?.user?.id ?? "anonymous");

    return NextResponse.json({ success: true, feedback });
  } catch (error: unknown) {
    console.error("Feedback API Error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback. Please try again." },
      { status: 500 }
    );
  }
}
