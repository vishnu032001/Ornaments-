"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatINR, shippingFor, taxFor } from "@/lib/utils";

export default function Checkout() {
  const { items } = useStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutRequestId] = useState(() => crypto.randomUUID());

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = shippingFor(subtotal);
  const tax = taxFor(subtotal);
  const total = subtotal + shipping + tax;

  if (!items.length) {
    return <section className="mx-auto max-w-xl px-6 py-24 text-center"><h1 className="font-serif text-5xl">Your bag is empty</h1><Link href="/shop" className="mt-8 inline-flex rounded-full bg-charcoal px-7 py-3 text-white">Shop jewellery</Link></section>;
  }

  async function startPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          checkoutRequestId,
          items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Unable to start payment.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.");
      setLoading(false);
    }
  }

  return <section className="mx-auto max-w-6xl px-6 py-12">
    <h1 className="font-serif text-5xl">Checkout</h1>
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
      <form onSubmit={startPayment} className="space-y-8">
        <fieldset>
          <legend className="font-serif text-2xl">Contact</legend>
          <input required type="email" autoComplete="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="mt-4 w-full rounded-xl border bg-transparent p-4" />
          <p className="mt-2 text-xs text-stone-500">Guest checkout is supported. Sign in to keep orders attached to your account.</p>
        </fieldset>
        <fieldset>
          <legend className="font-serif text-2xl">Delivery</legend>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input required autoComplete="name" placeholder="Full name" className="rounded-xl border bg-transparent p-4 md:col-span-2" />
            <input required autoComplete="street-address" placeholder="Address" className="rounded-xl border bg-transparent p-4 md:col-span-2" />
            <input required autoComplete="address-level2" placeholder="City" className="rounded-xl border bg-transparent p-4" />
            <input required autoComplete="postal-code" placeholder="Postal code" className="rounded-xl border bg-transparent p-4" />
          </div>
          <p className="mt-2 text-xs text-stone-500">Delivery details are displayed for checkout; address persistence will be added with fulfillment/inventory.</p>
        </fieldset>
        <fieldset>
          <legend className="font-serif text-2xl">Payment</legend>
          <div className="mt-4 rounded-xl border p-4 text-sm text-stone-600">Secure payment is hosted by Stripe. Your card details are entered on Stripe’s payment page, not stored by Aurelia.</div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-charcoal py-4 text-white disabled:opacity-60">{loading ? "Opening secure payment…" : `Pay securely · ${formatINR(total)}`}</button>
      </form>
      <aside className="h-fit rounded-2xl bg-sand p-6">
        <h2 className="font-serif text-2xl">Order summary</h2>
        {items.map(i => <div key={i.product.id} className="mt-4 flex justify-between gap-4 text-sm"><span>{i.product.name} × {i.quantity}</span><span>{formatINR(i.product.price * i.quantity)}</span></div>)}
        <div className="mt-6 border-t pt-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="mt-2 flex justify-between"><span>Shipping</span><span>{shipping ? formatINR(shipping) : "Free"}</span></div>
          <div className="mt-2 flex justify-between"><span>Tax</span><span>{formatINR(tax)}</span></div>
          <div className="mt-4 flex justify-between text-lg font-medium"><span>Total</span><span>{formatINR(total)}</span></div>
        </div>
      </aside>
    </div>
  </section>;
}
