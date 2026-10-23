import Stripe from "stripe";
import { NextResponse } from "next/server";
import { serverClient, serverUrlFor } from "@/sanity/lib/serverClient";
import { MAX_ITEM_QUANTITY, normalizeCart } from "@/sanity/lib/checkout-validation.mjs";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  try {
    return new Stripe(secretKey);
  } catch {
    return null;
  }
}

function getCheckoutConfiguration() {