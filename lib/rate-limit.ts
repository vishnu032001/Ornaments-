import { prisma } from "@/lib/prisma";

export async function checkAuthRateLimit(key: string, limit = 10, windowMs = 15 * 60 * 1000) {
  const now = new Date();
  const existing = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!existing || now.getTime() - existing.windowStart.getTime() >= windowMs) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return true;
  }
  if (existing.count >= limit) return false;
  await prisma.authRateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
