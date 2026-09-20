"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { getAnalyticsConsent } from "@/components/AnalyticsConsentBanner";

export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const sync = () => setAllowed(getAnalyticsConsent() === "granted");
    sync();
    window.addEventListener("aurelia:analytics-consent", sync);
    return () => window.removeEventListener("aurelia:analytics-consent", sync);
  }, []);
  if (!id || !allowed) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${id}',{send_page_view:true});`}</Script>
  </>;
}