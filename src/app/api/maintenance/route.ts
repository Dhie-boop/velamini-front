import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required.
// Called by the middleware on every page request to check maintenance mode.
const MAINTENANCE_CACHE_TTL_MS = 30_000;
let cachedMaintenance: { on: boolean; expiresAt: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (cachedMaintenance && cachedMaintenance.expiresAt > now) {
    return NextResponse.json({ on: cachedMaintenance.on });
  }

  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: "maintenanceMode" },
    });
    const on = setting?.value === "true";
    cachedMaintenance = { on, expiresAt: now + MAINTENANCE_CACHE_TTL_MS };
    return NextResponse.json({ on });
  } catch {
    // If DB is unreachable, don't block the site
    if (cachedMaintenance) {
      return NextResponse.json({ on: cachedMaintenance.on });
    }
    return NextResponse.json({ on: false });
  }
}
