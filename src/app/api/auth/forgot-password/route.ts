import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail } from "@/lib/send-reset-password-email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Don't reveal if user exists
    return NextResponse.json({ ok: true });
  }
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: expires,
    },
  });
  if (!user.email) {
    return NextResponse.json({ error: "User email not found" }, { status: 400 });
  }
  await sendResetPasswordEmail(user.email, token);
  return NextResponse.json({ ok: true });
}
