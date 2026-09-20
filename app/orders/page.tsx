import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return <section className="mx-auto max-w-5xl px-6 py-12">
    <Link href="/account" className="text-sm text-stone-500">← Account</Link>
    <h1 className="mt-4 font-serif text-5xl">Order history</h1>
    {orders.length === 0 ? <div className="mt-10 rounded-2xl bg-sand p-8 text-stone-600">No orders yet. <Link href="/shop" className="underline">Explore jewellery</Link></div> : <div className="mt-10 space-y-5">{orders.map(order => <article key={order.id} className="rounded-2xl border p-6"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-medium">Order #{order.id.slice(-8)}</p><p className="mt-1 text-sm text-stone-500">{order.createdAt.toLocaleDateString("en-IN")}</p></div><div className="text-right"><p>{order.status}</p><p className="mt-1 font-medium">{formatINR(order.total)}</p></div></div><div className="mt-5 border-t pt-4 text-sm">{order.items.map(item => <div key={item.id} className="flex justify-between gap-4 py-1"><span>{item.name} × {item.quantity}</span><span>{formatINR(item.unitPrice * item.quantity)}</span></div>)}</div></article>)}</div>}
  </section>;
}