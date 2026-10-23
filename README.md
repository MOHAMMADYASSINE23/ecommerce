# E-commerce Store

A full-stack commerce web application built with Next.js and Sanity. The storefront fetches product and banner content from Sanity and renders the product collection alongside hero and footer banners.

## Tech stack

- **Next.js 15** and **React 19** for the web application
- **Sanity** and **next-sanity** for structured product and banner content
- **Stripe** packages are included for payment-related integration
- **Tailwind CSS** tooling and ESLint for styling support and code quality

## Features visible in the current codebase

- Product listing queried from Sanity
- Dynamic hero and footer banner content queried from Sanity
- Reusable product and banner components
- Next.js App Router structure

Checkout validates product IDs and quantities on the server and uses the current product prices from Sanity. Complete an end-to-end test with Stripe test-mode credentials before treating payments as production-ready.

## Getting started

### Requirements

- Node.js compatible with the installed Next.js version
- npm
- A configured Sanity project with the required product and banner schemas

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to `.env.local` and replace the placeholders with your own project settings and test credentials. **Never commit `.env.local` or real API keys.**

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the production application |
| `npm run start` | Start the production server after building |
| `npm run lint` | Run ESLint |

## Project status

This repository is under active improvement. Before deployment, verify environment configuration, empty/loading/error states, checkout and payment handling, accessibility, responsive layouts, and production build behavior.

## Security

- Keep environment files and credentials out of Git.
- Use test-mode payment credentials during development.
- `STRIPE_SECRET_KEY` and `SANITY_API_READ_TOKEN` are server-only. Never prefix them with `NEXT_PUBLIC_` or import them into client components.
- The browser-side Sanity client uses public project configuration only; checkout uses a separate server-only client.
- Checkout ignores client-supplied product names, prices, and images. The server reloads canonical product data from Sanity.
- `SITE_URL` defines the checkout return origin; the API does not trust the request `Origin` header for redirect URLs.
- If a real Stripe secret was ever stored in `NEXT_PUBLIC_STRIPE_SECRET_KEY`, rotate it in Stripe and remove the old environment variable from all deployment environments.
