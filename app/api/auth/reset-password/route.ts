import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth";

const schema = z.object({ token: z.string().min(20), password: z.string().min(8).max(72) });

export async function POST(request: Request) {
  try {
    const body = schema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
    const token = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(body.data.token) },
    });
    if (!token || token.expiresAt <= new Date()) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });

    const passwordHash = await bcrypt.hash(body.data.password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: token.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.delete({ where: { id: token.id } }),
      prisma.session.deleteMany({ where: { userId: token.userId } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reset-password", error);
    return NextResponse.json({ error: "Unable to reset your password." }, { status: 500 });
  }
}
