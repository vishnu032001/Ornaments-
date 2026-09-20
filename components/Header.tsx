"use client";
import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function Header() {
  const [open, setOpen] = useState(false);
  const count = useStore(s => s.items.reduce((n, i) => n + i.quantity, 0));
  const nav = [["Shop","/shop"],["Necklaces","/shop?category=Necklaces"],["Earrings","/shop?category=Earrings"],["Bangles","/shop?category=Bangles"],["Rings","/shop?category=Rings"]];
  return <>
    <div className="bg-charcoal px-4 py-2 text-center text-[10px] tracking-[.2em] text-white">COMPLIMENTARY SHIPPING ON ORDERS ABOVE ₹2,499</div>
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X/> : <Menu/>}</button>
        <Link href="/" className="font-serif text-2xl tracking-wide">Aurelia</Link>
        <nav className="hidden gap-7 text-sm md:flex">{nav.map(([n,h]) => <Link key={n} href={h} className="hover:text-rose">{n}</Link>)}</nav>
        <div className="flex items-center gap-4">
          <Search className="hidden h-5 w-5 md:block" />
          <Link href="/account" aria-label="My account"><UserRound className="h-5 w-5" /></Link>
          <button onClick={() => useStore.getState().setCartOpen(true)} className="relative" aria-label="Open cart"><ShoppingBag className="h-5 w-5"/>{count > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-rose px-1.5 text-[9px] text-white">{count}</span>}</button>
        </div>
      </div>
      {open && <nav className="border-t px-5 py-4 md:hidden">{nav.map(([n,h]) => <Link onClick={() => setOpen(false)} key={n} href={h} className="block py-3">{n}</Link>)}<Link onClick={() => setOpen(false)} href="/account" className="block py-3">My account</Link></nav>}
    </header>
  </>;
}