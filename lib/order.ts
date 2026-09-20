import { prisma } from "@/lib/prisma";
import { calculateCheckoutPricing, type ShippingAddress } from "@/lib/checkout-pricing";
import products from "@/data/products";

export type RequestedItem = { productId: string; quantity: number };

export class InventoryUnavailableError extends Error {
  constructor(public readonly productId: string) {
    super(`Insufficient inventory for product ${productId}.`);
    this.name = "InventoryUnavailableError";
  }
}

function isRetryableTransactionError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    && ((error as { code?: string }).code === "P2034" || (error as { code?: string }).code === "P2002");
}

function uniqueItems(items: RequestedItem[]) {
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  return [...quantities.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export function priceOrder(items: RequestedItem[], address: ShippingAddress) {
  return calculateCheckoutPricing(uniqueItems(items), address);
}

export async function findOrCreateOrder(input: {
  checkoutRequestId: string;
  email: string;
  userId?: string | null;
  items: RequestedItem[];
  shippingAddress: ShippingAddress;
}) {
  const pricing = priceOrder(input.items, input.shippingAddress);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await prisma.order.findUnique({
      where: { checkoutRequestId: input.checkoutRequestId },
      select: { id: true, total: true, status: true, paymentStatus: true, stripeCheckoutSessionId: true },
    });
    if (existing) return { order: existing, pricing: null };

    try {
      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            checkoutRequestId: input.checkoutRequestId,
            userId: input.userId ?? null,
            guestEmail: input.userId ? null : input.email,
            total: pricing.total,
            subtotal: pricing.subtotal,
            shippingAmount: pricing.shipping,
            taxAmount: pricing.tax,
            taxRateBps: pricing.taxRateBps,
            taxName: pricing.taxName,
            taxJurisdiction: pricing.taxJurisdiction,
            taxBreakdown: pricing.taxBreakdown,
            shippingZone: pricing.shippingZone,
            shippingRule: pricing.shippingRule,
            shippingName: input.shippingAddress.name,
            shippingLine1: input.shippingAddress.line1,
            shippingCity: input.shippingAddress.city,
            shippingState: input.shippingAddress.state,
            shippingPostalCode: input.shippingAddress.postalCode,
            shippingCountry: input.shippingAddress.country,
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
    } catch (error) {
      if (error instanceof InventoryUnavailableError) throw error;
      if (!isRetryableTransactionError(error) || attempt === 2) throw error;
    }
  }

  throw new Error("Unable to create checkout order.");
}
