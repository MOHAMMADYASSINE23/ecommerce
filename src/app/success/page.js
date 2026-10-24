import React from "react";
import Link from "next/link";
import Stripe from "stripe";

export default async function Success({ searchParams }) {
  const { session_id: sessionId } = await searchParams;
  let paymentConfirmed = false;

  if (
    process.env.STRIPE_SECRET_KEY &&
    typeof sessionId === "string" &&
    /^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId)
  ) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paymentConfirmed =
        session.mode === "payment" &&
        session.status === "complete" &&
        session.payment_status === "paid";
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Stripe payment verification failed:", error);
      }
    }
  }

  return (
    <div className="success-wrapper">
      <div className="success">
        <p className="icon" aria-hidden="true">{paymentConfirmed ? "✅" : "🕓"}</p>
        <h2>{paymentConfirmed ? "Payment confirmed. Thank you!" : "Payment not confirmed yet"}</h2>
        <p className="email-msg">
          {paymentConfirmed
            ? "Your Stripe checkout payment was verified."
            : "This page only confirms a payment after Stripe verifies the checkout session. If you just paid, check your Stripe receipt and try again."}
        </p>
        <p className="description">
          {paymentConfirmed
            ? "Order recording is handled separately by Stripe's webhook and may take a moment. Fulfillment is not automated in this demo."
            : "No order has been confirmed by this page."}
        </p>
        <Link href="/" className="btn">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
