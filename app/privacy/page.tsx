import Link from "next/link";
function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl px-6 py-20"><Link href="/" className="text-sm text-stone-500">← Aurelia</Link><h1 className="mt-8 font-serif text-5xl">{title}</h1><p className="mt-3 text-sm text-stone-500">Last updated 21 September 2026</p><div className="mt-10 space-y-8 text-sm leading-7 text-stone-700">{children}</div></main>;
}
export default function PrivacyPage() {
  return <Legal title="Privacy Policy">
    <section><h2 className="font-serif text-2xl text-stone-900">Information we collect</h2><p>We may collect account details, checkout and delivery information, order history, and technical information needed to operate and secure the store.</p></section>
    <section><h2 className="font-serif text-2xl text-stone-900">Optional analytics</h2><p>Google Analytics 4 is optional. We do not load it until you choose “Allow analytics” in the privacy choices banner. Your choice is stored in this browser so we can remember it.</p></section>
    <section><h2 className="font-serif text-2xl text-stone-900">Payments and service providers</h2><p>Payments are processed through Stripe. We may use service providers for hosting, email delivery, analytics (only with consent), fraud prevention, and order fulfilment.</p></section>
    <section><h2 className="font-serif text-2xl text-stone-900">Your choices</h2><p>You can decline analytics. To change the choice later, clear this site’s browser storage or use the privacy controls that the store may add in a future release.</p></section>
    <section><h2 className="font-serif text-2xl text-stone-900">Contact</h2><p>Replace this placeholder with the legal business name, address, privacy contact, retention periods, and applicable rights before launch.</p></section>
  </Legal>;
}