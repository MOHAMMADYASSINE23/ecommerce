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
  const siteUrlValue = process.env.SITE_URL;
  const shippingRateId = process.env.STRIPE_SHIPPING_RATE_ID;
  const allowedCountries = (process.env.STRIPE_ALLOWED_SHIPPING_COUNTRIES ?? "")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter((country) => /^[A-Z]{2}$/.test(country));

  if (!siteUrlValue || !shippingRateId || allowedCountries.length === 0) {
    return null;
  }

  try {
    const siteUrl = new URL(siteUrlValue);
    if (
      !["http:", "https:"].includes(siteUrl.protocol) ||
      (siteUrl.protocol !== "https:" && siteUrl.hostname !== "localhost")
    ) {
      return null;
    }

    return {
      siteOrigin: siteUrl.origin,
      shippingRateId,
      allowedCountries,
    };
  } catch {
    return null;
  }
}

export async function POST(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json(
      { error: "Checkout request must be JSON." },
      { status: 415 },
    );
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > 64 * 1024) {
      return NextResponse.json(
        { error: "Checkout request is too large or invalid." },
        { status: 413 },
      );
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const cart = normalizeCart(body);
  if (!cart) {
    return NextResponse.json(
      { error: "Cart must contain valid product IDs and quantities." },
      { status: 400 },
    );
  }

  const stripe = getStripeClient();
  const checkoutConfig = getCheckoutConfiguration();
  if (!stripe || !checkoutConfig) {
    return NextResponse.json(
      { error: "Checkout is not configured. Please try again later." },
      { status: 503 },
    );
  }

  try {
    const productIds = cart.map((item) => item.productId);
    const products = await serverClient.fetch(
      '*[_type == "product" && _id in $ids && !(_id in path("drafts.**"))]{_id, name, price, image}',
      { ids: productIds },
    );
    const productsById = new Map(products.map((product) => [product._id, product]));

    if (productsById.size !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products are no longer available." },
        { status: 400 },
      );
    }

    const lineItems = cart.map(({ productId, quantity }) => {
      const product = productsById.get(productId);
      const unitAmount = Math.round(Number(product.price) * 100);

      if (
        typeof product.name !== "string" ||
        !product.name.trim() ||
        !Number.isSafeInteger(unitAmount) ||
        unitAmount < 1 ||
        unitAmount > 10_000_000
      ) {
        throw new Error("Invalid product pricing configuration");
      }

      const firstImage = Array.isArray(product.image) ? product.image[0] : null;
      let imageUrl;
      if (firstImage) {
        try {
          imageUrl = serverUrlFor(firstImage).width(800).url();
        } catch {
          imageUrl = undefined;
        }
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name.trim().slice(0, 250),
            ...(imageUrl ? { images: [imageUrl] } : {}),
          },
          unit_amount: unitAmount,
        },
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
          maximum: MAX_ITEM_QUANTITY,
        },
        quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      submit_type: "pay",
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: checkoutConfig.allowedCountries,
      },
      shipping_options: [{ shipping_rate: checkoutConfig.shippingRateId }],
      line_items: lineItems,
      success_url: `${checkoutConfig.siteOrigin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${checkoutConfig.siteOrigin}/canceled`,
    });

    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", {
      type: error?.type,
      code: error?.code,
      statusCode: error?.statusCode,
      requestId: error?.requestId,
    });

    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 502 },
    );
  }
}
