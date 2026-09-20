import { NextResponse } from "next/server";
import { getCurrentUser, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const result = await prisma.order.updateMany({
    where: { userId: null, guestEmail: normalizeEmail(user.email) },
    data: { userId: user.id, guestEmail: null },
  });
  return NextResponse.json({ linkedOrders: result.count });
}
