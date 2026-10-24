import { createClient } from "@sanity/client";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { buildPaidOrderRecord } from "@/sanity/lib/order-record.mjs";
import { readLimitedBody } from "@/sanity/lib/checkout-validation.mjs";

export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 1024 * 1024;
const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

function getWebhookConfiguration() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sanityToken = process.env.SANITY_API_WRITE_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";

  if (!stripeSecret || !webhookSecret || !sanityToken || !projectId || !dataset) {
    return null;
  }

  try {
    return {
      stripe: new Stripe(stripeSecret),
      webhookSecret,
      sanity: createClient({
        projectId,
        dataset,
        apiVersion,
        token: sanityToken,
        useCdn: false,
      }),
    };
  } catch {
    return null;
  }
}

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = Number(contentLength);
    if (!Number.isSafeInteger(size) || size < 0 || size > MAX_WEBHOOK_BYTES) {
      return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
    }
  }

  const bodyResult = await readLimitedBody(request.body, MAX_WEBHOOK_BYTES);
  if (!bodyResult.ok) {
    return NextResponse.json(
      { error: bodyResult.reason === "too-large" ? "Webhook payload is too large." : "Invalid webhook payload." },
      { status: bodyResult.reason === "too-large" ? 413 : 400 },
    );
  }

  const config = getWebhookConfiguration();
  if (!config) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  let event;
  try {
    event = config.stripe.webhooks.constructEvent(
      bodyResult.text,
      signature,
      config.webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const eventSession = event.data?.object;
  if (
    !eventSession ||
    typeof eventSession.id !== "string" ||
    eventSession.mode !== "payment" ||
    eventSession.status !== "complete" ||
    eventSession.payment_status !== "paid"
  ) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const session = await config.stripe.checkout.sessions.retrieve(eventSession.id);
    if (
      session.mode !== "payment" ||
      session.status !== "complete" ||
      session.payment_status !== "paid"
    ) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const lineItemsResponse = await config.stripe.checkout.sessions.listLineItems(
      session.id,
      { limit: 100 },
    );
    const order = buildPaidOrderRecord(
      session,
      lineItemsResponse.data,
      new Date(event.created * 1000).toISOString(),
    );

    if (!order) {
      console.error("Paid Stripe session failed order validation.", {
        eventId: event.id,
        sessionId: session.id,
      });
      return NextResponse.json({ error: "Paid session could not be recorded." }, { status: 500 });
    }

    // Stripe retries webhook deliveries. The deterministic document ID makes
    // repeated deliveries safe and prevents duplicate orders for one session.
    await config.sanity.createIfNotExists(order);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook order persistence failed.", {
      eventId: event.id,
      type: error?.type,
      code: error?.code,
      statusCode: error?.statusCode,
    });
    // A non-2xx response asks Stripe to retry transient failures.
    return NextResponse.json({ error: "Unable to record paid order." }, { status: 500 });
  }
}
