"use client";

import {useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import {SlidersHorizontal} from "lucide-react";
import {products} from "@/data/products";
import ProductCard from "./ProductCard";

const cats=["All","Necklaces","Earrings","Bangles","Rings","Bracelets","Accessories"];
const mats=["All","Gold-plated","Silver","Pearl","Beaded"];

export default function ShopClient(){
  const searchParams=useSearchParams();
  const initialCategory=searchParams.get("category");
  const[cat,setCat]=useState(()=>initialCategory&&cats.includes(initialCategory)?initialCategory:"All");
  const[mat,setMat]=useState("All");
  const[max,setMax]=useState(5000);
  const[sort,setSort]=useState("popular");
  const filtered=useMemo(()=>products.filter(p=>(cat==="All"||p.category===cat)&&(mat==="All"||p.material===mat)&&p.price<=max).sort((a,b)=>sort==="low"?a.price-b.price:sort==="high"?b.price-a.price:b.popularity-a.popularity),[cat,mat,max,sort]);

  return <section className="mx-auto max-w-7xl px-6 py-12">
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs uppercase tracking-[.25em] text-rose">The collection</p><h1 className="mt-2 font-serif text-5xl">Shop jewellery</h1></div>
      <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-full border bg-transparent px-4 py-3 text-sm" aria-label="Sort products">
        <option value="popular">Sort: Popular</option><option value="low">Price: Low to high</option><option value="high">Price: High to low</option>
      </select>
    </div>
    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">
        <Filter title="Category">{cats.map(c=><button key={c} onClick={()=>setCat(c)} className={"mb-2 block text-left text-sm "+(cat===c?"font-semibold text-rose":"text-stone-600")}>{c}</button>)}</Filter>
        <Filter title="Material">{mats.map(m=><button key={m} onClick={()=>setMat(m)} className={"mb-2 block text-left text-sm "+(mat===m?"font-semibold text-rose":"text-stone-600")}>{m}</button>)}</Filter>
        <Filter title={"Price up to ₹"+max}><input aria-label="Maximum price" type="range" min="500" max="5000" step="100" value={max} onChange={e=>setMax(Number(e.target.value))} className="w-full"/></Filter>
      </aside>
      <div>
        <div className="mb-5 flex justify-between text-sm text-stone-500"><span>{filtered.length} pieces</span><span className="lg:hidden"><SlidersHorizontal className="inline h-4 w-4"/> Filters</span></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-6">{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>
        {!filtered.length&&<div className="py-20 text-center text-stone-500">No pieces match these filters.</div>}
      </div>
    </div>
    <div className="mt-8 grid gap-3 lg:hidden">
      <select value={cat} onChange={e=>setCat(e.target.value)} className="rounded-xl border bg-transparent p-3" aria-label="Filter by category">{cats.map(c=><option key={c}>{c}</option>)}</select>
      <select value={mat} onChange={e=>setMat(e.target.value)} className="rounded-xl border bg-transparent p-3" aria-label="Filter by material">{mats.map(m=><option key={m}>{m}</option>)}</select>
      <label className="text-sm text-stone-600">Price up to ₹{max}<input aria-label="Maximum price" type="range" min="500" max="5000" step="100" value={max} onChange={e=>setMax(Number(e.target.value))} className="mt-2 w-full"/></label>
    </div>
  </section>
}
function Filter({title,children}:{title:string;children:React.ReactNode}){return <div className="mb-8"><h3 className="mb-4 text-xs uppercase tracking-[.2em]">{title}</h3>{children}</div>}
