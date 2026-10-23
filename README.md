# E-commerce Store

A portfolio commerce storefront built with Next.js, Sanity, and Stripe test-mode checkout. Products and banners are managed in Sanity; the checkout API reloads canonical product data and prices on the server instead of trusting browser-supplied prices.

## Features

- Product catalog, product detail pages, and dynamic hero/footer banners.
- Sanity Studio embedded in the Next.js app.
- Server-side Stripe Checkout session creation with cart validation, quantity limits, configured shipping, and trusted return URLs.
- Payment-success page that verifies the Stripe Checkout session with Stripe before showing a confirmed-payment message.
- Automated checkout validation tests, lint, production build, and dependency audit checks.

## Tech stack

- Next.js 16 and React 19
- Sanity and next-sanity
- Stripe Checkout
- Node.js and npm

## Run locally

Requirements: Node.js 22.12 or newer, npm, and a configured Sanity project.

```bash
git clone https://github.com/MOHAMMADYASSINE23/ecommerce.git
cd ecommerce
npm ci
cp .env.example .env.local
npm run dev
```

Fill in `.env.local` with your own Sanity project settings, a server-side read-only Sanity token if needed, and Stripe test-mode configuration. Never commit `.env.local` or real credentials.

## Environment variables

- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `NEXT_PUBLIC_SANITY_API_VERSION` configure public catalog reads.
- `SANITY_API_READ_TOKEN` is an optional server-only read token.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is public browser configuration.
- `STRIPE_SECRET_KEY` must remain server-only.
- `SITE_URL` defines the trusted checkout return origin.
- `STRIPE_SHIPPING_RATE_ID` and `STRIPE_ALLOWED_SHIPPING_COUNTRIES` configure shipping in Stripe Checkout.

## Quality checks

```bash
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev
```

GitHub Actions runs these checks for the security hardening pull request. Review the latest workflow result before merging or deploying.

## Security and scope

- The server ignores client-supplied prices, product names, and images. It loads product details from Sanity.
- Checkout request shape, product IDs, quantities, body size, shipping settings, and redirect origin are validated.
- Stripe and Sanity secret credentials are never exposed through `NEXT_PUBLIC_*` variables.
- The success page verifies the Stripe session, but **this demo does not yet persist orders or fulfill them from a verified Stripe webhook**. Do not use it as a production order-management or fulfillment system until webhook-backed order persistence is implemented.
- Use Stripe test mode and a non-production Sanity dataset while testing. Rotate any real secret that was ever exposed in a browser-prefixed environment variable.
