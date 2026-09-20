import type {Metadata} from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
export const metadata:Metadata={title:"Aurelia Ornaments | Modern Fancy Jewellery",description:"Elegant artificial jewellery for weddings, celebrations and everyday style."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/><main>{children}</main><Footer/><CartDrawer/></body></html>}