import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

export const metadata: Metadata = {
  metadataBase: new URL("https://aurelia-ornaments.vercel.app"),
  title: { default: "Aurelia Ornaments | Modern Fancy Jewellery", template: "%s | Aurelia Ornaments" },
  description: "Elegant artificial jewellery for weddings, celebrations and everyday style.",
  openGraph: {
    title: "Aurelia Ornaments",
    description: "Elegant artificial jewellery for weddings, celebrations and everyday style.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Aurelia Ornaments", description: "Elegant artificial jewellery for weddings and everyday style." },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Header /><main>{children}</main><Footer /><CartDrawer /></body></html>;
}