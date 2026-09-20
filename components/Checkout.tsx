"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";

type Quote = { subtotal:number; shipping:number; tax:number; total:number; shippingZone:string; taxRateBps:number };

export default function Checkout() {
  const { items } = useStore();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("KA");
  const [postalCode, setPostalCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [checkoutRequestId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!name || !line1 || !city || !/^\d{6}$/.test(postalCode)) { setQuote(null); return; }
      setQuoting(true);
      try {
        const response = await fetch("/api/checkout/quote", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
            address: { name, line1, city, state, postalCode, country: "IN" },
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to calculate delivery.");
        setQuote(data);
        setError("");
      } catch (err) {
        setQuote(null);
        setError(err instanceof Error ? err.message : "Unable to calculate delivery.");
      } finally { setQuoting(false); }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [items, name, line1, city, state, postalCode]);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  if (!items.length) {
    return <section className="mx-auto max-w-xl px-6 py-24 text-center"><h1 className="font-serif text-5xl">Your bag is empty</h1><Link href="/shop" className="mt-8 inline-flex rounded-full bg-charcoal px-7 py-3 text-white">Shop jewellery</Link></section>;
  }

  async function startPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote) { setError("Enter a complete delivery address to calculate shipping and GST."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, checkoutRequestId,
          items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          shippingAddress: { name, line1, city, state, postalCode, country: "IN" },
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
            <input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Full name" className="rounded-xl border bg-transparent p-4 md:col-span-2" />
            <input required value={line1} onChange={e=>setLine1(e.target.value)} autoComplete="street-address" placeholder="Address" className="rounded-xl border bg-transparent p-4 md:col-span-2" />
            <input required value={city} onChange={e=>setCity(e.target.value)} autoComplete="address-level2" placeholder="City" className="rounded-xl border bg-transparent p-4" />
            <select required value={state} onChange={e=>setState(e.target.value)} className="rounded-xl border bg-transparent p-4" aria-label="State">
              <option value="KA">Karnataka</option><option value="TN">Tamil Nadu</option><option value="MH">Maharashtra</option><option value="DL">Delhi</option><option value="TS">Telangana</option><option value="AP">Andhra Pradesh</option><option value="KL">Kerala</option><option value="GJ">Gujarat</option><option value="WB">West Bengal</option><option value="RJ">Rajasthan</option><option value="UP">Uttar Pradesh</option><option value="HR">Haryana</option><option value="PB">Punjab</option><option value="OD">Odisha</option><option value="BR">Bihar</option><option value="JH">Jharkhand</option><option value="MP">Madhya Pradesh</option><option value="CG">Chhattisgarh</option><option value="AS">Assam</option>
            </select>
            <input required value={postalCode} onChange={e=>setPostalCode(e.target.value.replace(/\D/g,"").slice(0,6))} autoComplete="postal-code" inputMode="numeric" placeholder="6-digit PIN code" className="rounded-xl border bg-transparent p-4" />
          </div>
          <p className="mt-2 text-xs text-stone-500">{quoting ? "Calculating delivery and GST…" : quote ? `Shipping zone: ${quote.shippingZone} · GST ${(quote.taxRateBps/100).toFixed(2)}%` : "Shipping and GST update from your delivery PIN and state."}</p>
        </fieldset>
        <fieldset>
          <legend className="font-serif text-2xl">Payment</legend>
          <div className="mt-4 rounded-xl border p-4 text-sm text-stone-600">Secure payment is hosted by Stripe. Your card details are entered on Stripe’s payment page, not stored by Aurelia.</div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={loading || quoting || !quote} className="w-full rounded-full bg-charcoal py-4 text-white disabled:opacity-60">{loading ? "Opening secure payment…" : `Pay securely · ${formatINR(quote?.total ?? subtotal)}`}</button>
      </form>
      <aside className="h-fit rounded-2xl bg-sand p-6">
        <h2 className="font-serif text-2xl">Order summary</h2>
        {items.map(i => <div key={i.product.id} className="mt-4 flex justify-between gap-4 text-sm"><span>{i.product.name} × {i.quantity}</span><span>{formatINR(i.product.price * i.quantity)}</span></div>)}
        <div className="mt-6 border-t pt-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(quote?.subtotal ?? subtotal)}</span></div>
          <div className="mt-2 flex justify-between"><span>Shipping</span><span>{quote ? (quote.shipping ? formatINR(quote.shipping) : "Free") : "Enter PIN"}</span></div>
          <div className="mt-2 flex justify-between"><span>GST</span><span>{quote ? formatINR(quote.tax) : "—"}</span></div>
          <div className="mt-4 flex justify-between text-lg font-medium"><span>Total</span><span>{formatINR(quote?.total ?? subtotal)}</span></div>
        </div>
      </aside>
    </div>
  </section>;
}
