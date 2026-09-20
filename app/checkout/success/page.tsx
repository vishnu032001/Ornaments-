"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { trackPurchase } from "@/lib/analytics";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id");
  const [tracked, setTracked] = useState(false);
  const clearCart = useStore((state) => state.clearCart);

  useEffect(() => { clearCart(); }, [clearCart]);
  useEffect(() => { if (!orderId || tracked) return; trackPurchase(orderId, [], 0); setTracked(true); }, [orderId, tracked]);

  return <section className="mx-auto max-w-2xl px-6 py-24 text-center">
    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sand text-2xl">✓</div>
    <h1 className="mt-6 font-serif text-5xl">Payment received</h1>
    <p className="mt-4 text-stone-600">Your payment is being confirmed. {orderId ? <>Order #{orderId.slice(-8)}.</> : null}</p>
    <p className="mt-2 text-sm text-stone-500">We’ll email your receipt after the payment webhook confirms the transaction.</p>
    <div className="mt-8 flex justify-center gap-3">
      <Link href="/orders" className="rounded-full border px-6 py-3">View orders</Link>
      <Link href="/shop" className="rounded-full bg-charcoal px-7 py-3 text-white">Continue shopping</Link>
    </div>
  </section>;
}

export default function CheckoutSuccessPage() {
  return <Suspense fallback={<section className="mx-auto max-w-2xl px-6 py-24 text-center"><p className="text-stone-500">Confirming your payment…</p></section>}><SuccessContent /></Suspense>;
}
