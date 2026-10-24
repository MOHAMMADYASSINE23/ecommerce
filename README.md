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
- `SANITY_API_WRITE_TOKEN` is a server-only token allowed to create order documents in the configured Sanity dataset. Use a least-privilege token and never expose it through `NEXT_PUBLIC_*`.
- `STRIPE_WEBHOOK_SECRET` is the signing secret for the Stripe webhook endpoint. Keep it server-only.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is public browser configuration.
- `STRIPE_SECRET_KEY` must remain server-only.
- `SITE_URL` defines the trusted checkout return origin.
- `STRIPE_SHIPPING_RATE_ID` and `STRIPE_ALLOWED_SHIPPING_COUNTRIES` configure shipping in Stripe Checkout.

## Stripe webhook setup

Configure a Stripe webhook endpoint at `/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Set `STRIPE_WEBHOOK_SECRET` to the endpoint signing secret, and set `SANITY_API_WRITE_TOKEN` to a server-only Sanity token with permission to create order documents. Use Stripe CLI forwarding for local testing. The handler verifies the Stripe signature against the raw request body, retrieves the checkout session and line items from Stripe, stores only completed paid payment sessions, and uses a deterministic Sanity document ID so Stripe retries do not create duplicate orders.

The stored order includes the Stripe session/payment intent identifiers, total, currency, line items, optional customer email, and shipping address. Treat order documents as personal data and restrict Sanity Studio access accordingly. Test the webhook using Stripe test mode before deployment.

## Quality checks

```bash
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev
```

GitHub Actions runs tests, lint, build, and dependency-audit checks on pushes to `main` and pull requests. The dependency audit currently reports non-critical findings, so review the latest workflow results and resolve advisories before production deployment.

## Security and scope

- The server ignores client-supplied prices, product names, and images. It loads product details from Sanity.
- Checkout request shape, product IDs, quantities, body size, shipping settings, and redirect origin are validated.
- Stripe and Sanity secret credentials are never exposed through `NEXT_PUBLIC_*` variables.
- The success page verifies the Stripe session for the customer-facing confirmation. The webhook independently verifies Stripe's signature and payment status before persisting an order. **Automatic fulfillment, inventory reservation, refunds, and customer notifications are not implemented.** Do not treat a stored paid order as proof that those downstream operations have completed.
- Use Stripe test mode and a non-production Sanity dataset while testing. Rotate any real secret that was ever exposed in a browser-prefixed environment variable.
- The latest CI production-tree audit reports 8 moderate findings and no high or critical findings after applying patched transitive dependency overrides. Counts can change as advisories are published, so use the latest workflow output as the source of truth. CI blocks critical findings and reports the remaining advisories, but this does **not** mean the dependency audit is clean. Review and resolve the remaining advisories before production use.
