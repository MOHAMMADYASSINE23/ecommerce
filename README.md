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

Payment and checkout behavior should be verified in the current implementation before treating it as production-ready.

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

Create a local `.env.local` file for the credentials and project settings required by the Sanity client and any payment-related features. Check the source configuration for the exact variable names. **Do not commit secrets or real API keys.**

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
- Never expose secret payment keys in browser-side code.
- Rotate any real secret that has been exposed.
