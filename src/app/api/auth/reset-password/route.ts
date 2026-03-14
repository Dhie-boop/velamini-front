import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  }
  const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!reset || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
  }
  const hashed = await hash(password, 10);
  await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: hashed } });
  await prisma.passwordResetToken.delete({ where: { token } });
  return NextResponse.json({ ok: true });
}
