import products from "@/data/products";

export type ShippingAddress = {
  name: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: "IN";
};

export type RequestedItem = { productId: string; quantity: number };

const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD_INR ?? 2499);
const BASE_SHIPPING_INR = Number(process.env.BASE_SHIPPING_INR ?? 99);
const PER_KG_INR = Number(process.env.PER_KG_SHIPPING_INR ?? 60);
const GST_RATE_BPS = Number(process.env.GST_RATE_BPS ?? 300);

const stateCodes = new Set([
  "AN","AP","AR","AS","BR","CH","CG","DH","DL","DN","GA","GJ","HR","HP","JK","JH","KA","KL","LA","LD","MP","MH","MN","ML","MZ","NL","OD","PY","PB","RJ","SK","TN","TS","TR","UP","UK","WB"
]);

function normalizePincode(value: string) {
  return value.replace(/\D/g, "");
}

export function validateShippingAddress(address: ShippingAddress) {
  const postalCode = normalizePincode(address.postalCode);
  if (postalCode.length !== 6 || postalCode.startsWith("0")) throw new Error("Enter a valid 6-digit Indian postal code.");
  if (!stateCodes.has(address.state.toUpperCase())) throw new Error("Select a valid Indian state code.");
  return { ...address, state: address.state.toUpperCase(), postalCode };
}

function shippingZone(postalCode: string, state: string) {
  const prefix = Number(postalCode.slice(0, 2));
  if (state === "KA" && prefix >= 56 && prefix <= 59) return { name: "Karnataka", surcharge: 0 };
  if (prefix >= 40 && prefix <= 49) return { name: "West", surcharge: 20 };
  if (prefix >= 50 && prefix <= 59) return { name: "South", surcharge: 20 };
  if (prefix >= 60 && prefix <= 69) return { name: "East", surcharge: 30 };
  if (prefix >= 70 && prefix <= 79) return { name: "North-East", surcharge: 50 };
  return { name: "North", surcharge: 30 };
}

export function calculateCheckoutPricing(items: RequestedItem[], address: ShippingAddress) {
  const unique = new Map<string, number>();
  for (const item of items) unique.set(item.productId, (unique.get(item.productId) ?? 0) + item.quantity);

  const lineItems = [...unique.entries()].map(([productId, quantity]) => {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) throw new Error("Invalid product.");
    return { product, quantity };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const weightKg = lineItems.reduce((sum, item) => sum + (item.quantity * 0.1), 0);
  const zone = shippingZone(address.postalCode, address.state);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : Math.ceil((BASE_SHIPPING_INR + weightKg * PER_KG_INR + zone.surcharge) / 10) * 10;

  const taxableAmount = subtotal + shipping;
  const tax = Math.round((taxableAmount * GST_RATE_BPS) / 10000);
  const taxBreakdown = address.state === "KA"
    ? { cgst: Math.round(tax / 2), sgst: tax - Math.round(tax / 2), igst: 0 }
    : { cgst: 0, sgst: 0, igst: tax };
  return {
    lineItems,
    subtotal,
    weightKg,
    shipping,
    tax,
    total: subtotal + shipping + tax,
    taxRateBps: GST_RATE_BPS,
    taxName: "GST",
    taxJurisdiction: address.state,
    taxBreakdown,
    shippingZone: zone.name,
    shippingRule: subtotal >= FREE_SHIPPING_THRESHOLD ? "free-over-threshold" : "weight-and-zone",
  };
}
