import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateCheckoutPricing, validateShippingAddress } from "@/lib/checkout-pricing";

const schema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  address: z.object({
    name: z.string().trim().min(2).max(120),
    line1: z.string().trim().min(3).max(200),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().length(2),
    postalCode: z.string().regex(/^\d{6}$/),
    country: z.literal("IN"),
  }),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid delivery address and cart." }, { status: 400 });
    const address = validateShippingAddress(parsed.data.address);
    return NextResponse.json(calculateCheckoutPricing(parsed.data.items, address));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to calculate checkout totals." }, { status: 400 });
  }
}
