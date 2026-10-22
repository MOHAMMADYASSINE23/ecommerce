import Stripe from "stripe";
import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/serverClient";
import { urlFor } from "@/sanity/lib/client";

const PRODUCT_QUERY = '*[_type == "product" && _id in $ids]{_id, name, price, image}';

function isValidProductId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9._-]{1,128}$/.test(value);
}

export async function POST(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.SITE_URL;
  const shippingRateId = process.env.STRIPE_SHIPPING_RATE_ID;

  if (!secretKey || !siteUrl || !shippingRateId) {
    return NextResponse.json(
      { message: "Checkout is not fully configured on this deployment." },
      { status: 503 },
    );
  }

  let siteOrigin;
  try {
    const parsedSiteUrl = new URL(siteUrl);
    if (!["https:", "http:"].includes(parsedSiteUrl.protocol)) {
      throw new Error("Invalid site URL protocol");
    }
    if (process.env.NODE_ENV === "production" && parsedSiteUrl.protocol !== "https:") {
      throw new Error("Production site URL must use HTTPS");
    }
    siteOrigin = parsedSiteUrl.origin;
  } catch {
    return NextResponse.json({ message: "Checkout site URL is invalid." }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return NextResponse.json({ message: "Checkout request origin is required." }, { status: 403 });
  }
  try {
    if (new URL(origin).origin !== siteOrigin) {
      return NextResponse.json({ message: "Checkout request origin is not allowed." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ message: "Checkout request origin is invalid." }, { status: 403 });
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ message: "Checkout request must be JSON." }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64 * 1024) {
    return NextResponse.json({ message: "Checkout request is too large." }, { status: 413 });
  }

  let cartItems;
  try {
    cartItems = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid checkout request." }, { status: 400 });
  }

  if (!Array.isArray(cartItems) || cartItems.length < 1 || cartItems.length > 50) {
    return NextResponse.json({ message: "Cart must contain between 1 and 50 items." }, { status: 400 });
  }

  const validItems = cartItems.map((item) => ({
    id: item?._id,
    quantity: item?.quantity,
  }));

  if (validItems.some((item) =>
    !isValidProductId(item.id) ||
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > 20
  )) {
    return NextResponse.json({ message: "Cart contains an invalid product or quantity." }, { status: 400 });
  }

  const ids = [...new Set(validItems.map((item) => item.id))];

  try {
    const products = await serverClient.fetch(PRODUCT_QUERY, { ids });
    const productsById = new Map(products.map((product) => [product._id, product]));

    if (productsById.size !== ids.length) {
      return NextResponse.json({ message: "One or more products are no longer available." }, { status: 400 });
    }

    const lineItems = validItems.map(({ id, quantity }) => {
      const product = productsById.get(id);
      const price = Number(product?.price);

      if (
        !product?.name ||
        !Number.isFinite(price) ||
        price <= 0 ||
        price > 100000
      ) {
        throw new Error("Invalid product pricing in Sanity catalog.");
      }

      const productData = { name: product.name };
      const image = product.image?.[0];
      if (image) {
        productData.images = [urlFor(image).url()];
      }

      return {
        price_data: {
          currency: "usd",
          product_data: productData,
          unit_amount: Math.round(price * 100),
        },
        quantity,
      };
    });

    const stripe = new Stripe(secretKey);
    const allowedCountries = (process.env.STRIPE_ALLOWED_SHIPPING_COUNTRIES || "US")
      .split(",")
      .map((country) => country.trim().toUpperCase())
      .filter(Boolean);
    if (allowedCountries.length === 0 || allowedCountries.some((country) => !/^[A-Z]{2}$/.test(country))) {
      return NextResponse.json({ message: "Shipping countries are not configured correctly." }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: siteOrigin + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: siteOrigin + "/?checkout=canceled",
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: allowedCountries },
      shipping_options: [{ shipping_rate: shippingRateId }],
    });

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Stripe checkout creation failed:", error);
    }
    return NextResponse.json({ message: "Unable to create checkout session." }, { status: 500 });
  }
}
