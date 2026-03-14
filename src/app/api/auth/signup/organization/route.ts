import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { orgName, industry, website, agentName, agentPersonality, email, password } = await req.json();

    if (!orgName || !email || !password || !agentName) {
      return NextResponse.json(
        { error: "Organisation name, admin email, password and agent name are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    // Create everything atomically
    await prisma.$transaction(async (tx) => {
      // 1. Create the user
      const user = await tx.user.create({
        data: {
          name: orgName, // Fallback for user name just in case
          email,
          passwordHash: hashedPassword,
          accountType: "organization",
          onboardingComplete: false, // Wait for verify
        },
      });

      // 2. Create the Organization + nested KnowledgeBase
      const apiKey = `vela_${randomUUID().replace(/-/g, "")}`;
      await tx.organization.create({
        data: {
          name: orgName,
          contactEmail: email,
          industry: industry || null,
          website: website || null,
          agentName: agentName,
          agentPersonality: agentPersonality || null,
          ownerId: user.id,
          apiKey,
          // automatically provision a KnowledgeBase for them
          knowledgeBase: {
            create: {
              userId: null,
            },
          },
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[org register error]", error);
    return NextResponse.json(
      { error: "Something went wrong creating the organisation." },
      { status: 500 }
    );
  }
}
