import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { releasePhoneNumber } from "@/lib/twilio-provisioning";

// GET /api/organizations/[id] - Get single organization
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id,
        ownerId: session.user.id, // Ensure user owns this org
      },
      include: {
        knowledgeBase: true,
        _count: {
          select: {
            chats: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // JIT: Generate API key if missing (older accounts)
    if (!organization.apiKey) {
      const newKey = `vela_${randomUUID().replace(/-/g, "")}`;
      await prisma.organization.update({
        where: { id: organization.id },
        data: { apiKey: newKey },
      });
      organization.apiKey = newKey;
    }

    return NextResponse.json({ ok: true, organization });
  } catch (error) {
    console.error("Get organization error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch organization." },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/[id] - Update organization
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingOrg = await prisma.organization.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    
    // Explicit allowlist of fields an owner may update
    // Sensitive/system fields (apiKey, planType, monthlyMessageLimit, isActive, etc.) are NOT included
    const {
      name,
      description,
      industry,
      website,
      contactEmail,
      welcomeMessage,
      autoReplyEnabled,
      businessHoursEnabled,
      businessHoursStart,
      businessHoursEnd,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name                !== undefined) updateData.name                = name;
    if (description         !== undefined) updateData.description         = description;
    if (industry            !== undefined) updateData.industry            = industry;
    if (website             !== undefined) updateData.website             = website;
    if (contactEmail        !== undefined) updateData.contactEmail        = contactEmail;
    if (welcomeMessage      !== undefined) updateData.welcomeMessage      = welcomeMessage;
    if (autoReplyEnabled    !== undefined) updateData.autoReplyEnabled    = autoReplyEnabled;
    if (businessHoursEnabled !== undefined) updateData.businessHoursEnabled = businessHoursEnabled;
    if (businessHoursStart  !== undefined) updateData.businessHoursStart  = businessHoursStart;
    if (businessHoursEnd    !== undefined) updateData.businessHoursEnd    = businessHoursEnd;

    const organization = await prisma.organization.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, organization });
  } catch (error) {
    console.error("Update organization error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update organization." },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingOrg = await prisma.organization.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Release the Twilio phone number before deleting the org
    if (existingOrg.whatsappNumberSid) {
      try {
        await releasePhoneNumber(existingOrg.whatsappNumberSid);
        console.log("Released Twilio number:", existingOrg.whatsappNumberSid);
      } catch (twilioErr) {
        // Log but don't block deletion — number may already be released
        console.error("Failed to release Twilio number (continuing with deletion):", twilioErr);
      }
    }

    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: "Organization deleted" });
  } catch (error) {
    console.error("Delete organization error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete organization." },
      { status: 500 }
    );
  }
}
