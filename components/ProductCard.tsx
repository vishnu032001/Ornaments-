"use client";

import Image from "next/image";
import Link from "next/link";
import {ShoppingBag,Star} from "lucide-react";
import type {Product} from "@/types/product";
import {formatINR} from "@/lib/utils";
import {useStore} from "@/lib/store";

export default function ProductCard({product}:{product:Product}){
  const add=useStore(s=>s.addItem);
  return <article className="group">
    <Link href={"/product/"+product.slug} className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
      <Image src={product.images[0]} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-0" />
      <Image src={product.images[1]||product.images[0]} alt="" fill className="object-cover opacity-0 transition duration-500 group-hover:opacity-100 group-hover:scale-105" />
      {product.badge&&<span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[10px] uppercase tracking-wider">{product.badge}</span>}
    </Link>
    <div className="flex items-start justify-between gap-3 pt-4">
      <div><Link href={"/product/"+product.slug} className="font-medium">{product.name}</Link><div className="mt-1 flex items-center gap-1 text-xs text-stone-500"><Star className="h-3 w-3 fill-current"/>{product.rating}</div><p className="mt-2 font-medium">{formatINR(product.price)}</p></div>
      <button onClick={()=>add(product)} className="rounded-full border border-stone-300 p-3 hover:bg-charcoal hover:text-white" aria-label={"Add "+product.name+" to cart"}><ShoppingBag className="h-4 w-4"/></button>
    </div>
  </article>
}
