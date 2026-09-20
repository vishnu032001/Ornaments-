# Aurelia Ornaments

Premium responsive artificial-jewellery storefront built with Next.js App Router, TypeScript, Tailwind CSS and Zustand.

## Current production foundation

- Customer signup/login with bcrypt password hashing
- Opaque database-backed sessions stored as SHA-256 token hashes
- HttpOnly, Secure-in-production, SameSite=Lax session cookie
- Protected account and order-history routes
- Guest checkout and authenticated checkout through a server-side order API
- Guest-order claiming by authenticated account email
- Password reset tokens are single-use, hashed at rest and expire after 60 minutes
- Generic password-reset responses to reduce account enumeration
- Database-backed authentication rate limiting
- PostgreSQL + Prisma ORM schema and initial migration
- Server-authoritative product prices and order totals
- Stripe-hosted production checkout with server-side pricing
- Signed Stripe webhook verification with idempotent event processing
- Payment/order state transitions stored in PostgreSQL
- Automated order-confirmation emails through Resend

## Run locally

1. Copy .env.example to .env.local.
2. Set a PostgreSQL DATABASE_URL.
3. Set APP_URL and, for password-reset email delivery, RESEND_API_KEY and AUTH_FROM_EMAIL.
4. Apply the database migration:

~~~bash
npm install
npm run db:deploy
npm run dev
~~~

Open http://localhost:3000.

## Database workflow

Development:

~~~bash
npm run db:migrate
~~~

Production:

~~~bash
npm run db:deploy
~~~

Prisma Client is generated automatically by npm run typecheck and npm run build.

## Authentication flow

~~~text
Browser
  ↓
/login or /signup
  ↓
/api/auth/*
  ↓
bcrypt password verification
  ↓
random 256-bit session token
  ↓
SHA-256 token hash stored in PostgreSQL
  ↓
HttpOnly session cookie
  ↓
middleware presence check
  ↓
server-side getCurrentUser()/requireUser() authorization
~~~

The middleware is only an early redirect optimization. Sensitive data access is authorized again on the server, so a client cannot bypass authorization by forging UI state.

### Password reset

~~~text
Forgot password
  ↓
generic response
  ↓
single-use random reset token
  ↓
SHA-256 hash stored in PostgreSQL
  ↓
Resend email
  ↓
60-minute reset URL
  ↓
new bcrypt password hash
  ↓
all existing sessions revoked
~~~

### Guest checkout

Guest checkout remains available at /checkout. The browser sends product IDs and quantities to /api/checkout; the server re-reads prices from data/products.json and calculates totals before creating a Stripe Checkout Session. A UUID checkoutRequestId makes client retries idempotent. The order is persisted as PENDING before payment, then the Stripe webhook is the source of truth that transitions it to PAID. Authenticated users have their order attached to their account; guests are stored with their email. The claim endpoint is POST /api/orders/claim and links guest orders for the authenticated account with the same email.

## Payments and order processing

Stripe Checkout is used as the payment surface. The application never accepts or stores card details. INR amounts are sent to Stripe in the currency's required minor-unit representation.

~~~text
Checkout
  ↓
/api/checkout
  ↓
server re-prices products + shipping + tax
  ↓
PENDING Order + idempotent checkoutRequestId
  ↓
Stripe Checkout
  ↓
POST /api/webhooks/stripe
  ↓
signature verification
  ↓
idempotent webhook event record
  ↓
Order PENDING → PAID
  ↓
Resend order-confirmation email
  ↓
/checkout/success clears the browser cart
~~~

Configure a Stripe webhook endpoint at `/api/webhooks/stripe` and subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`. Stripe's webhook signature must be verified against the raw request body.

The payment webhook is authoritative: the success redirect only clears the local browser cart and displays a confirmation screen; it does not mark an order paid.

## Verification

~~~bash
npm run typecheck
npm run build
npm start
~~~

Repository CI runs typechecking and production builds with a non-secret CI database URL so Prisma Client generation does not require a real database connection.

## Environment variables

See .env.example. Never commit real credentials, database URLs, API keys, session secrets, or email-provider secrets.

## Production checklist

Before accepting real payments/orders:

- Provision managed PostgreSQL and configure pooled/direct connection URLs as appropriate.
- Run npm run db:deploy against production.
- Configure Resend with a verified sending domain.
- Configure Stripe Checkout and the signed webhook endpoint.
- Run the second Prisma migration with npm run db:deploy.
- Add inventory reservation/decrement in a database transaction.
- Add shipping/tax calculation based on the actual destination and applicable rules.
- Add CSRF protection if introducing cookie-authenticated state-changing browser endpoints outside same-origin flows.
- Add email verification and account-change notifications.
- Add account deletion/export flows and privacy/legal pages.
- Add observability, alerting, backups and restore testing.
- Add a dedicated admin authorization model before exposing operational dashboards.
- Replace Unsplash placeholders with licensed product photography.

## Deployment

Deploy the repository to Vercel or another Next.js-compatible host. Configure production environment variables in the host secret manager. Update metadataBase in app/layout.tsx to the real production URL before launch.
