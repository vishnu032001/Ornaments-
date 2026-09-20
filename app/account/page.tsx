import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, total: true, status: true, createdAt: true } });

  return <section className="mx-auto max-w-5xl px-6 py-12">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[.25em] text-rose">My account</p><h1 className="mt-2 font-serif text-5xl">{user.name || user.email}</h1><p className="mt-2 text-stone-500">{user.email}</p></div>
      <LogoutButton />
    </div>
    <div className="mt-12 rounded-2xl bg-sand p-6">
      <div className="flex items-center justify-between gap-4"><h2 className="font-serif text-2xl">Recent orders</h2><Link href="/orders" className="text-sm underline">View all</Link></div>
      {orders.length === 0 ? <p className="mt-4 text-stone-500">Your orders will appear here.</p> : <div className="mt-5 space-y-3">{orders.map(o => <div key={o.id} className="flex flex-wrap justify-between gap-3 rounded-xl bg-cream p-4 text-sm"><span>#{o.id.slice(-8)}</span><span>{o.status}</span><span>{formatINR(o.total)}</span></div>)}</div>}
    </div>
    <Link href="/shop" className="mt-8 inline-flex rounded-full bg-charcoal px-6 py-3 text-white">Continue shopping</Link>
  </section>;
}