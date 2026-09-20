import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const schema = z.object({ orderId: z.string().min(1).max(100), sessionId: z.string().startsWith("cs_").max(200) });

export async function GET(request: Request) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid confirmation request." }, { status: 400 });
  try {
    const session = await getStripe().checkout.sessions.retrieve(parsed.data.sessionId);
    const sessionOrderId = session.metadata?.orderId ?? session.client_reference_id;
    if (sessionOrderId !== parsed.data.orderId || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment is not confirmed." }, { status: 409 });
    }
    const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId }, include: { items: true } });
    if (!order || order.paymentStatus !== "PAID" || order.status !== "PAID") {
      return NextResponse.json({ error: "Order is not confirmed." }, { status: 409 });
    }
    return NextResponse.json({
      orderId: order.id,
      total: order.total,
      items: order.items.map((item) => ({ item_id: item.productId, item_name: item.name, price: item.unitPrice, quantity: item.quantity })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to confirm payment." }, { status: 400 });
  }
}