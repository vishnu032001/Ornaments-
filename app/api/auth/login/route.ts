import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, normalizeEmail } from "@/lib/auth";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";

const schema = z.object({ email: z.string().email().max(320), password: z.string().min(1).max(72) });

export async function POST(request: Request) {
  try {
    const body = schema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    const email = normalizeEmail(body.data.email);
    const ip = await getRequestIp();
    const allowed = await checkAuthRateLimit(`login:${ip}:${email}`, 10);
    if (!allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(body.data.password, user.passwordHash) : false;
    if (!user || !valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("login", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
