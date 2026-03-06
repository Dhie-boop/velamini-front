import { NextResponse } from "next/server";
import { log, warn, error as logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

// POST /api/log — receive client-side errors and forward to Vercel logs
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false }, { status: 400 });

    const { level = "ERROR", route, msg, data } = body;

    // Forward to server logger so it appears in Vercel output
    if (level === "ERROR") logError(`[CLIENT] ${route}`, msg, data);
    else if (level === "WARN")  warn(`[CLIENT] ${route}`, msg, data);
    else                        log(`[CLIENT] ${route}`, msg, data);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
