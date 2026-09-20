"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "aurelia_analytics_consent";
export type AnalyticsConsent = "granted" | "denied" | null;

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}
export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, null>) {
  window.localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent("aurelia:analytics-consent", { detail: value }));
}

export default function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent>(null);
  useEffect(() => {
    const sync = () => setConsent(getAnalyticsConsent());
    sync();
    window.addEventListener("aurelia:analytics-consent", sync);
    return () => window.removeEventListener("aurelia:analytics-consent", sync);
  }, []);
  if (consent) return null;
  return <aside className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
    <p className="font-medium text-stone-900">Privacy choices</p>
    <p className="mt-2 text-sm leading-6 text-stone-600">We use optional analytics to understand how the store is used and improve the shopping experience. Analytics is off until you choose to allow it.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button onClick={() => setAnalyticsConsent("granted")} className="rounded-full bg-charcoal px-5 py-2.5 text-sm text-white">Allow analytics</button>
      <button onClick={() => setAnalyticsConsent("denied")} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm text-stone-700">Continue without analytics</button>
      <a href="/privacy" className="rounded-full px-3 py-2.5 text-sm text-stone-500 underline underline-offset-4">Privacy policy</a>
    </div>
  </aside>;
}