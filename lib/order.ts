import { prisma } from "@/lib/prisma";
import { shippingFor, taxFor } from "@/lib/utils";
import products from "@/data/products";

export type RequestedItem = { productId: string; quantity: number };

export function priceOrder(items: RequestedItem[]) {
  const lineItems = items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) throw new Error("Invalid product.");
    return { product, quantity: item.quantity };
  });
  const subtotal = lineItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = shippingFor(subtotal);
  const tax = taxFor(subtotal);
  return { lineItems, subtotal, shipping, tax, total: subtotal + shipping + tax };
}

export async function findOrCreateOrder(input: {
  checkoutRequestId: string; email: string; userId?: string | null; items: RequestedItem[];
}) {
  const existing = await prisma.order.findUnique({
    where: { checkoutRequestId: input.checkoutRequestId },
    select: { id: true, total: true, status: true, paymentStatus: true, stripeCheckoutSessionId: true },
  });
  if (existing) return { order: existing, pricing: null };

  const pricing = priceOrder(input.items);
  const order = await prisma.order.create({
    data: {
      checkoutRequestId: input.checkoutRequestId,
      userId: input.userId ?? null,
      guestEmail: input.userId ? null : input.email,
      total: pricing.total,
      items: { create: pricing.lineItems.map(({ product, quantity }) => ({
        productId: product.id, name: product.name, unitPrice: product.price, quantity,
      })) },
    },
    select: { id: true, total: true, status: true, paymentStatus: true, stripeCheckoutSessionId: true },
  });
  return { order, pricing };
}
