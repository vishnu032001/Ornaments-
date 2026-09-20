import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, normalizeEmail } from "@/lib/auth";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(320),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  try {
    const body = schema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "Please enter valid account details." }, { status: 400 });
    const email = normalizeEmail(body.data.email);
    const allowed = await checkAuthRateLimit(`signup:${await getRequestIp()}`, 5);
    if (!allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

    const passwordHash = await bcrypt.hash(body.data.password, 12);
    const user = await prisma.user.create({ data: { name: body.data.name, email, passwordHash } });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("signup", error);
    return NextResponse.json({ error: "Unable to create your account." }, { status: 500 });
  }
}
