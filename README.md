# Aurelia Ornaments

Premium responsive artificial-jewellery storefront built with Next.js App Router, TypeScript, Tailwind CSS and Zustand.

## Features
- Elegant home page with hero, curated collections, trending products and testimonial
- Catalog filtering by category, material and price, plus popularity/price sorting
- Product detail gallery, specifications, quantity selection and add-to-cart
- Persistent slide-out cart with subtotal, shipping and estimated tax
- Accessible cart controls with Escape-to-close and focus styling
- Mock checkout flow
- INR pricing and mobile-first responsive UI
- Local JSON catalog; no external database required initially
- SEO metadata and Open Graph/Twitter defaults

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Verify
```bash
npm run typecheck
npm run build
npm start
```

## Deployment
Deploy the repository to Vercel or another Next.js-compatible host. Update `metadataBase` in `app/layout.tsx` to the real production URL before launch.

## Production checklist
Before taking real orders, add server-side order creation, payment processing and webhooks, authentication, inventory, tax/shipping rules, validation, persistence, email notifications, analytics, SEO verification, rate limiting, legal pages and licensed product photography. The checkout in this repository is intentionally a demo and does not process payments.

## Customize
Edit `data/products.json` for products and `tailwind.config.js` for design tokens. Replace the Unsplash placeholder images with licensed product photography before launch.
