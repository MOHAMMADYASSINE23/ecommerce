import assert from "node:assert/strict";
import test from "node:test";

import { buildPaidOrderRecord } from "../src/sanity/lib/order-record.mjs";

const session = {
  id: "cs_test_a1b2c3",
  mode: "payment",
  status: "complete",
  payment_status: "paid",
  metadata: { application: "ecommerce-store" },
  amount_total: 12500,
  currency: "usd",
  payment_intent: "pi_test_123",
  customer_details: { email: "buyer@example.test" },
  shipping_details: {
    name: "Example Buyer",
    address: {
      line1: "123 Example Street",
      city: "Beirut",
      country: "LB",
    },
  },
};

const lineItems = [
  { description: "Headphones", quantity: 1, amount_total: 12500, currency: "usd" },
];

test("builds a paid order with a deterministic ID and normalized line items", () => {
  const order = buildPaidOrderRecord(session, lineItems, "2026-10-24T00:00:00.000Z");

  assert.equal(order._id, "stripe-cs_test_a1b2c3");
  assert.equal(order._type, "order");
  assert.equal(order.status, "paid");
  assert.equal(order.totalAmount, 12500);
  assert.equal(order.customerEmail, "buyer@example.test");
  assert.deepEqual(order.lineItems, [{
    _key: "line-1",
    name: "Headphones",
    quantity: 1,
    amountTotal: 12500,
    currency: "usd",
  }]);
  assert.equal(order.shippingAddress.city, "Beirut");
  assert.equal(order.createdAt, "2026-10-24T00:00:00.000Z");
});

test("refuses sessions that are incomplete, unpaid, or not payment sessions", () => {
  assert.equal(buildPaidOrderRecord({ ...session, status: "open" }, lineItems, "2026-10-24"), null);
  assert.equal(buildPaidOrderRecord({ ...session, payment_status: "unpaid" }, lineItems, "2026-10-24"), null);
  assert.equal(buildPaidOrderRecord({ ...session, mode: "subscription" }, lineItems, "2026-10-24"), null);
});

test("rejects paid sessions created by unrelated Stripe integrations", () => {
  assert.equal(
    buildPaidOrderRecord(
      { ...session, metadata: { application: "another-app" } },
      lineItems,
      "2026-10-24",
    ),
    null,
  );
  assert.equal(
    buildPaidOrderRecord({ ...session, metadata: {} }, lineItems, "2026-10-24"),
    null,
  );
});

test("rejects malformed session IDs, totals, and currencies", () => {
  assert.equal(buildPaidOrderRecord({ ...session, id: "not-a-session" }, lineItems, "2026-10-24"), null);
  assert.equal(buildPaidOrderRecord({ ...session, amount_total: -1 }, lineItems, "2026-10-24"), null);
  assert.equal(buildPaidOrderRecord({ ...session, currency: "US dollars" }, lineItems, "2026-10-24"), null);
});

test("rejects invalid line items rather than storing untrusted records", () => {
  assert.equal(buildPaidOrderRecord(session, [], "2026-10-24"), null);
  assert.equal(buildPaidOrderRecord(session, [{ ...lineItems[0], quantity: 0 }], "2026-10-24"), null);
  assert.equal(buildPaidOrderRecord(session, [{ ...lineItems[0], amount_total: -10 }], "2026-10-24"), null);
  assert.equal(buildPaidOrderRecord(session, [{ ...lineItems[0], currency: "eur" }], "2026-10-24"), null);
  assert.equal(buildPaidOrderRecord(session, [{ ...lineItems[0], description: " " }], "2026-10-24"), null);
});

test("omits malformed, blank, or whitespace-only optional email and absent address", () => {
  const order = buildPaidOrderRecord(
    { ...session, customer_details: { email: "x".repeat(321) }, shipping_details: null },
    lineItems,
    "2026-10-24",
  );

  assert.equal("customerEmail" in order, false);
  const blankEmailOrder = buildPaidOrderRecord({ ...session, customer_details: { email: "   " } }, lineItems, "2026-10-24");
  assert.equal("customerEmail" in blankEmailOrder, false);
  const trimmedEmailOrder = buildPaidOrderRecord({ ...session, customer_details: { email: " buyer@example.test " } }, lineItems, "2026-10-24");
  assert.equal(trimmedEmailOrder.customerEmail, "buyer@example.test");
  assert.equal("shippingAddress" in order, false);
});
