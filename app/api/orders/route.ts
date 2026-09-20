import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import products from "@/data/products";
import { getCurrentUser, normalizeEmail } from "@/lib/auth";
import { shippingFor, taxFor } from "@/lib/utils";

const schema = z.object({
  email: z.string().email().max(320),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const body = schema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    const user = await getCurrentUser();
    const normalizedEmail = normalizeEmail(body.data.email);
    const lineItems = body.data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error("Invalid product.");
      return { product, quantity: item.quantity };
    });
    const subtotal = lineItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const total = subtotal + shippingFor(subtotal) + taxFor(subtotal);

    const order = await prisma.order.create({
      data: {
        userId: user?.id ?? null,
        guestEmail: user ? null : normalizedEmail,
        total,
        items: {
          create: lineItems.map(({ product, quantity }) => ({
            productId: product.id, name: product.name, unitPrice: product.price, quantity,
          })),
        },
      },
      select: { id: true, total: true, status: true },
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("create-order", error);
    return NextResponse.json({ error: "Unable to create order." }, { status: 500 });
  }
}
