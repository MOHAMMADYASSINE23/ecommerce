# E-commerce Store

A Next.js storefront using Sanity for product content and Stripe Checkout for payments. The project is a portfolio/demo storefront, not a production-ready commerce platform.

## Features

- Product and banner content managed in Sanity.
- Product details and image galleries.
- Client-side cart with server-validated Stripe checkout sessions.
- Stripe Checkout session verification on the success page.
- Server-only Sanity reads for checkout and server-rendered product listings.

## Requirements

- Node.js 20 or newer
- npm
- A Sanity project with the product and banner schemas in this repository
- Stripe test-mode secret key and a configured test shipping rate

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Configure the variables in `.env.local`:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `NEXT_PUBLIC_SANITY_API_VERSION` configure the public Sanity client used for image URLs.
- `SANITY_API_READ_TOKEN` is an optional server-only, read-only token for private Sanity datasets. Never prefix it with `NEXT_PUBLIC_`.
- `STRIPE_SECRET_KEY` is the server-only Stripe secret key. Use a test-mode key during development.
- `SITE_URL` is the trusted absolute origin used for Stripe return URLs.
- `STRIPE_SHIPPING_RATE_ID` is the shipping rate created in your Stripe test account.
- `STRIPE_ALLOWED_SHIPPING_COUNTRIES` is a comma-separated list of ISO country codes, for example `US,CA`.

Never commit `.env.local` or real credentials. Do not use production Stripe keys for local testing.

## Sanity setup

Use the product and banner schemas in `src/sanity/`. The server-side checkout fetches current product IDs, names, prices, and images directly from Sanity. The browser-supplied cart total, name, image, and price are not trusted. Checkout also requires a same-origin JSON request, validates quantities and payload size, and uses a configured site origin for Stripe return URLs.

If your Sanity dataset is private, configure a read-only `SANITY_API_READ_TOKEN`. Public product data returned by the product API is cached briefly and contains no Sanity token.

## Quality checks

```bash
npm ci
npm run lint
npm run build
npm audit --omit=dev
```

GitHub Actions runs the production dependency audit, lint, and production build on relevant pull requests.

## Production limitations

- Checkout creates Stripe sessions, but this demo does not yet persist orders or fulfill them from a verified Stripe webhook. Do not treat the success page as an order-management system.
- Configure and test Stripe webhooks before adding order persistence, shipping notifications, refunds, or fulfillment.
- Keep the Sanity product dataset and token permissions minimal.
