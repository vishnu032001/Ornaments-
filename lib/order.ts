import { prisma } from "@/lib/prisma";
import { shippingFor, taxFor } from "@/lib/utils";
import products from "@/data/products";

export type RequestedItem = { productId: string; quantity: number };

export class InventoryUnavailableError extends Error {
  constructor(public readonly productId: string) {
    super(`Insufficient inventory for product ${productId}.`);
    this.name = "InventoryUnavailableError";
  }
}

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

function uniqueItems(items: RequestedItem[]) {
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  return [...quantities.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export async function findOrCreateOrder(input: {
  checkoutRequestId: string; email: string; userId?: string | null; items: RequestedItem[];
}) {
  const existing = await prisma.order.findUnique({
    where: { checkoutRequestId: input.checkoutRequestId },
    select: { id: true, total: true, status: true, paymentStatus: true, stripeCheckoutSessionId: true },
  });
  if (existing) return { order: existing, pricing: null };

  const pricing = priceOrder(uniqueItems(input.items));
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
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

    for (const item of pricing.lineItems) {
      const changed = await tx.$executeRaw`UPDATE "InventoryItem"
        SET "reservedStock" = "reservedStock" + ${item.quantity}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "productId" = ${item.product.id}
          AND ("onHandStock" - "reservedStock") >= ${item.quantity}`;
      if (changed !== 1) throw new InventoryUnavailableError(item.product.id);
      await tx.inventoryReservation.create({
        data: { orderId: created.id, productId: item.product.id, quantity: item.quantity },
      });
    }
    return created;
  }, { isolationLevel: "Serializable" });

  return { order, pricing };
}
