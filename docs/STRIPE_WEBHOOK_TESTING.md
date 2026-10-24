# Stripe Checkout and webhook test checklist

This project uses Stripe **test mode**. Do not use real payment credentials or customer data during these checks.

## Local setup

- [ ] Install dependencies with `npm ci`.
- [ ] Copy `.env.example` to `.env.local` and configure the Sanity project/dataset, `STRIPE_SECRET_KEY`, `SITE_URL=http://localhost:3000`, shipping rate, and allowed shipping countries.
- [ ] Set `SANITY_API_WRITE_TOKEN` to a server-only token with only the permissions needed to create order documents. Never use a `NEXT_PUBLIC_*` variable for the token.
- [ ] Start the app with `npm run dev`.
- [ ] In another terminal, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and set the printed signing secret as `STRIPE_WEBHOOK_SECRET`. Restart the app after changing environment variables.
- [ ] Run `npm test` before testing the browser flow.

## Checkout and order persistence

- [ ] Add a published Sanity product to the cart and proceed to checkout.
- [ ] Use a Stripe test card, such as `4242 4242 4242 4242`, with a future expiry and any valid test CVC/postal code.
- [ ] Confirm the success page verifies the Stripe session before displaying a confirmed payment.
- [ ] Confirm the Stripe CLI receives a signed event and the webhook returns a successful response.
- [ ] In Sanity Studio, verify exactly one `order` document exists with an ID beginning `stripe-cs_test_`, the expected session ID, paid status, currency, total, line items, and optional customer/shipping fields.
- [ ] Resend the **same event** from the Stripe Dashboard and confirm it does not create a second order document.
- [ ] Open the success page with a random or malformed session ID and confirm it never displays a confirmed payment.
- [ ] Send a webhook request without a valid `stripe-signature` and confirm it is rejected with HTTP 400.
- [ ] Verify a checkout session from a different Stripe integration is not recorded as this store's order.
- [ ] If testing a temporary Sanity write failure, confirm the webhook returns a retryable non-2xx response and Stripe can retry after the configuration is restored.

## Production-readiness boundaries

- [ ] Repeat the tests using a non-production Sanity dataset and the intended deployed webhook endpoint before considering a production deployment.
- [ ] Restrict Sanity Studio access to order documents because they contain personal data.
- [ ] Confirm the webhook endpoint's signing secret and Sanity write token are configured only as server-side secrets.
- [ ] Remember that a saved paid order is **not** proof of shipping, inventory reservation, refunds, or customer notifications. Those workflows are not implemented in this demo.

The latest dependency audit still reports 8 moderate findings in the Sanity/Studio dependency tree. See the main [README security notes](../README.md) and current GitHub Actions results before production use.
