import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

async function commitInventory(tx: any, orderId: string) {
  const reservations = await tx.inventoryReservation.findMany({ where: { orderId, status: "ACTIVE" } });
  for (const reservation of reservations) {
    const changed = await tx.inventoryItem.updateMany({
      where: {
        productId: reservation.productId,
        reservedStock: { gte: reservation.quantity },
        onHandStock: { gte: reservation.quantity },
      },
      data: {
        onHandStock: { decrement: reservation.quantity },
        reservedStock: { decrement: reservation.quantity },
      },
    });
    if (changed.count !== 1) throw new Error("Inventory reservation could not be committed.");
    await tx.inventoryReservation.update({ where: { id: reservation.id }, data: { status: "COMMITTED" } });
  }
}

async function releaseInventory(tx: any, orderId: string) {
  const reservations = await tx.inventoryReservation.findMany({ where: { orderId, status: "ACTIVE" } });
  for (const reservation of reservations) {
    const changed = await tx.inventoryItem.updateMany({
      where: { productId: reservation.productId, reservedStock: { gte: reservation.quantity } },
      data: { reservedStock: { decrement: reservation.quantity } },
    });
    if (changed.count !== 1) throw new Error("Inventory reservation could not be released.");
    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: "RELEASED", releasedAt: new Date() },
    });
  }
}

export const runtime = "nodejs";

async function markPaid(session: Stripe.Checkout.Session, event: Stripe.Event) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId || session.payment_status !== "paid") return;

  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const updated = await prisma.$transaction(async (tx) => {
    try {
      await tx.stripeWebhookEvent.create({ data: { id: event.id, type: event.type } });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") return null;
      throw error;
    }
    const result = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "PENDING", status: "PENDING" },
      data: { paymentStatus: "PAID", status: "PAID", paidAt: new Date(), stripePaymentIntentId: paymentIntent },
    });
    if (result.count === 1) await commitInventory(tx, orderId);
    return result.count === 1;
  });
  if (!updated) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId }, include: { items: true, user: { select: { email: true } } },
  });
  if (!order || order.confirmationSentAt) return;
  const email = order.user?.email ?? order.guestEmail;
  if (!email) return;

  try {
    await sendOrderConfirmationEmail({
      email, orderId: order.id, total: order.total,
      items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice })),
    });
    await prisma.order.updateMany({ where: { id: order.id, confirmationSentAt: null }, data: { confirmationSentAt: new Date() } });
  } catch (error) {
    console.error("order-confirmation-email", error);
  }
}

async function recordFailed(session: Stripe.Checkout.Session, event: Stripe.Event) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return;
  await prisma.$transaction(async (tx) => {
    try {
      await tx.stripeWebhookEvent.create({ data: { id: event.id, type: event.type } });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") return;
      throw error;
    }
    const result = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "PENDING", status: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
    if (result.count === 1) await releaseInventory(tx, orderId);
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await markPaid(event.data.object as Stripe.Checkout.Session, event);
        break;
      case "checkout.session.async_payment_failed":
        await recordFailed(event.data.object as Stripe.Checkout.Session, event);
        break;
      case "checkout.session.expired":
        await recordFailed(event.data.object as Stripe.Checkout.Session, event);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("stripe-webhook", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
