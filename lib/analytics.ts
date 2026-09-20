export type EcommerceItem = { item_id: string; item_name: string; price: number; quantity: number; item_category?: string };

type AnalyticsEvent = Record<string, unknown>;

declare global { interface Window { dataLayer?: AnalyticsEvent[]; gtag?: (...args: unknown[]) => void; } }

export function trackEvent(name: string, params: AnalyticsEvent = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer?.push({ event: name, ...params });
  window.gtag?.("event", name, params);
}

export function trackAddToCart(item: EcommerceItem) { trackEvent("add_to_cart", { currency: "INR", value: item.price * item.quantity, items: [item] }); }
export function trackBeginCheckout(items: EcommerceItem[], value: number) { trackEvent("begin_checkout", { currency: "INR", value, items }); }
export function trackPurchase(transactionId: string, items: EcommerceItem[], value: number) { trackEvent("purchase", { transaction_id: transactionId, currency: "INR", value, items }); }
