import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { getCurrentUser, normalizeEmail } from "@/lib/auth";
import { findOrCreateOrder, InventoryUnavailableError } from "@/lib/order";
import { validateShippingAddress } from "@/lib/checkout-pricing";
import { prisma } from "@/lib/prisma";

const addressSchema = z.object({
  name: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().length(2),
  postalCode: z.string().regex(/^\d{6}$/),
  country: z.literal("IN"),
});

const schema = z.object({
  email: z.string().email().max(320),
  checkoutRequestId: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  shippingAddress: addressSchema,
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });

    const user = await getCurrentUser();
    const email = normalizeEmail(parsed.data.email);
    const shippingAddress = validateShippingAddress(parsed.data.shippingAddress);
    const result = await findOrCreateOrder({
      checkoutRequestId: parsed.data.checkoutRequestId,
      email,
      userId: user?.id,
      items: parsed.data.items,
      shippingAddress,
    });

    if (result.order.stripeCheckoutSessionId) {
      const existingSession = await getStripe().checkout.sessions.retrieve(result.order.stripeCheckoutSessionId);
      if (existingSession.url) return NextResponse.json({ orderId: result.order.id, url: existingSession.url });
    }

    if (!result.pricing) throw new Error("Unable to recover checkout pricing.");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
    if (!baseUrl) throw new Error("APP_URL is required.");

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: result.order.id,
      metadata: { orderId: result.order.id, shippingZone: result.pricing.shippingZone, taxRateBps: String(result.pricing.taxRateBps) },
      shipping_address_collection: { allowed_countries: ["IN"] },
      line_items: [
        ...result.pricing.lineItems.map(({ product, quantity }) => ({
          price_data: {
            currency: "inr",
            product_data: { name: product.name, description: product.material },
            unit_amount: product.price * 100,
          },
          quantity,
        })),
        ...(result.pricing.shipping ? [{ price_data: { currency: "inr", product_data: { name: `Shipping · ${result.pricing.shippingZone}` }, unit_amount: result.pricing.shipping * 100 }, quantity: 1 }] : []),
        ...(result.pricing.tax ? [{ price_data: { currency: "inr", product_data: { name: `GST · ${(result.pricing.taxRateBps / 100).toFixed(2)}%` }, unit_amount: result.pricing.tax * 100 }, quantity: 1 }] : []),
      ],
      success_url: `${baseUrl}/checkout/success?order_id=${encodeURIComponent(result.order.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?cancelled=1`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    }, { idempotencyKey: parsed.data.checkoutRequestId });

    await prisma.order.update({ where: { id: result.order.id }, data: { stripeCheckoutSessionId: session.id } });
    return NextResponse.json({ orderId: result.order.id, url: session.url });
  } catch (error) {
    if (error instanceof InventoryUnavailableError) {
      return NextResponse.json(
        { error: "One or more items are no longer available in the requested quantity.", productId: error.productId },
        { status: 409 },
      );
    }
    console.error("create-checkout-session", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start payment." }, { status: 500 });
  }
}
