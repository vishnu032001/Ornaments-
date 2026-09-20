"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { formatINR, shippingFor, taxFor } from "@/lib/utils";

export default function CartDrawer() {
  const { items, cartOpen, setCartOpen, setQuantity, removeItem } = useStore();
  const closeRef = useRef<HTMLButtonElement>(null);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = shippingFor(subtotal);
  const tax = taxFor(subtotal);
  const total = subtotal + shipping + tax;

  useEffect(() => {
    if (!cartOpen) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  return (
    <div className={"fixed inset-0 z-50 " + (cartOpen ? "" : "pointer-events-none")} aria-hidden={!cartOpen}>
      <button aria-label="Close cart" onClick={() => setCartOpen(false)} className={"absolute inset-0 bg-black/30 transition " + (cartOpen ? "opacity-100" : "opacity-0")} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={"absolute right-0 top-0 h-full w-full max-w-md bg-cream p-6 shadow-2xl transition-transform " + (cartOpen ? "translate-x-0" : "translate-x-full")}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl">Your bag</h2>
          <button ref={closeRef} onClick={() => setCartOpen(false)} aria-label="Close shopping cart" className="rounded-full p-2 hover:bg-sand"><X /></button>
        </div>
        {!items.length ? (
          <div className="grid h-[70%] place-items-center text-center text-stone-500">
            <div>Your bag is waiting for something beautiful.<Link href="/shop" onClick={() => setCartOpen(false)} className="mt-4 block text-charcoal underline">Explore jewellery</Link></div>
          </div>
        ) : (
          <>
            <div className="mt-7 space-y-5 overflow-y-auto pb-5" style={{ maxHeight: "52vh" }}>
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3">
                  <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-sand"><Image src={product.images[0]} alt={product.name} fill className="object-cover" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{product.name}</p><p className="mt-1 text-sm">{formatINR(product.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => setQuantity(product.id, quantity - 1)} className="rounded-full border p-1" aria-label={"Decrease " + product.name}><Minus className="h-3 w-3" /></button>
                      <span aria-label={"Quantity " + quantity}>{quantity}</span>
                      <button onClick={() => setQuantity(product.id, quantity + 1)} className="rounded-full border p-1" aria-label={"Increase " + product.name}><Plus className="h-3 w-3" /></button>
                      <button onClick={() => removeItem(product.id)} className="ml-auto rounded-full p-2" aria-label={"Remove " + product.name}><Trash2 className="h-4 w-4 text-stone-400" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-5 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="mt-2 flex justify-between"><span>Shipping</span><span>{shipping ? formatINR(shipping) : "Free"}</span></div>
              <div className="mt-2 flex justify-between"><span>Estimated tax</span><span>{formatINR(tax)}</span></div>
              <div className="mt-4 flex justify-between text-lg font-medium"><span>Total</span><span>{formatINR(total)}</span></div>
              <Link href="/checkout" onClick={() => setCartOpen(false)} className="mt-5 block rounded-full bg-charcoal py-3 text-center text-white">Checkout</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}