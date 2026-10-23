import assert from "node:assert/strict";
import test from "node:test";

import { MAX_CART_LINES, MAX_ITEM_QUANTITY, normalizeCart, readLimitedBody } from "../src/sanity/lib/checkout-validation.mjs";

test("normalizes product IDs and quantities without trusting client prices", () => {
  assert.deepEqual(
    normalizeCart([
      { _id: "product-1", quantity: 2, price: 0.01, name: "Fake price" },
      { productId: "product-1", quantity: 3, price: 0.01 },
      { _id: "product-2", quantity: 1, price: 999999 },
    ]),
    [
      { productId: "product-1", quantity: 5 },
      { productId: "product-2", quantity: 1 },
    ],
  );
});

test("rejects empty, non-array, and oversized carts", () => {
  assert.equal(normalizeCart(null), null);
  assert.equal(normalizeCart({ _id: "product-1", quantity: 1 }), null);
  assert.equal(normalizeCart([]), null);
  assert.equal(normalizeCart(Array.from({ length: MAX_CART_LINES + 1 }, (_, i) => ({
    _id: `product-${i}`,
    quantity: 1,
  }))), null);
});

test("rejects invalid product IDs and draft documents", () => {
  assert.equal(normalizeCart([{ quantity: 1 }]), null);
  assert.equal(normalizeCart([{ _id: "", quantity: 1 }]), null);
  assert.equal(normalizeCart([{ _id: " ", quantity: 1 }]), null);
  assert.equal(normalizeCart([{ _id: " product-1", quantity: 1 }]), null);
  assert.equal(normalizeCart([{ _id: "product-1 ", quantity: 1 }]), null);
  assert.equal(normalizeCart([{ _id: "drafts.product-1", quantity: 1 }]), null);
  assert.equal(normalizeCart([{ _id: "x".repeat(129), quantity: 1 }]), null);
});

test("accepts only integer quantities between one and the configured maximum", () => {
  for (const quantity of [0, -1, 1.5, MAX_ITEM_QUANTITY + 1, "2", null]) {
    assert.equal(normalizeCart([{ _id: "product-1", quantity }]), null);
  }

  assert.deepEqual(
    normalizeCart([{ _id: "product-1", quantity: MAX_ITEM_QUANTITY }]),
    [{ productId: "product-1", quantity: MAX_ITEM_QUANTITY }],
  );
});

test("rejects duplicate line items that exceed the quantity cap", () => {
  assert.equal(
    normalizeCart([
      { _id: "product-1", quantity: MAX_ITEM_QUANTITY },
      { _id: "product-1", quantity: 1 },
    ]),
    null,
  );
});

test("reads a request body in chunks without changing its text", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('{"items":'));
      controller.enqueue(encoder.encode('[1,2]}'));
      controller.close();
    },
  });

  assert.deepEqual(await readLimitedBody(stream, 32), {
    ok: true,
    text: '{"items":[1,2]}',
  });
});

test("cancels a streamed request body as soon as it exceeds the byte limit", async () => {
  let wasCancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("12345"));
    },
    cancel() {
      wasCancelled = true;
    },
  });

  assert.deepEqual(await readLimitedBody(stream, 4), {
    ok: false,
    reason: "too-large",
  });
  assert.equal(wasCancelled, true);
});

test("rejects invalid UTF-8 request bodies", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([0xff]));
      controller.close();
    },
  });

  assert.deepEqual(await readLimitedBody(stream, 8), {
    ok: false,
    reason: "invalid",
  });
});
