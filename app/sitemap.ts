import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aurelia-ornaments.vercel.app";
  const lastModified = new Date();
  return [
    { url: baseUrl, lastModified },
    { url: `${baseUrl}/shop`, lastModified },
    { url: `${baseUrl}/privacy`, lastModified },
    { url: `${baseUrl}/terms`, lastModified },
    { url: `${baseUrl}/refund`, lastModified },
  ];
}
