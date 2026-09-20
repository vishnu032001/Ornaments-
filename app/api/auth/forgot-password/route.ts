import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken, newToken, normalizeEmail } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";

const schema = z.object({ email: z.string().email().max(320) });
const generic = { message: "If an account exists for that email, a reset link has been sent." };

export async function POST(request: Request) {
  try {
    const body = schema.safeParse(await request.json());
    if (!body.success) return NextResponse.json(generic);
    if (!await checkAuthRateLimit(`reset:${await getRequestIp()}`, 5)) return NextResponse.json(generic);
    const email = normalizeEmail(body.data.email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json(generic);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const raw = newToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) throw new Error("APP_URL is not configured.");
    await sendPasswordResetEmail(user.email, `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(raw)}`);
    return NextResponse.json(generic);
  } catch (error) {
    console.error("forgot-password", error);
    return NextResponse.json(generic);
  }
}
