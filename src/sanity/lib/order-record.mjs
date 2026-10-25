const MAX_ORDER_LINES = 100;
const MAX_ITEM_QUANTITY = 99;

function normalizeAddress(address) {
  if (!address || typeof address !== "object") return undefined;

  const fields = {
    name: address.name,
    line1: address.address?.line1,
    line2: address.address?.line2,
    city: address.address?.city,
    state: address.address?.state,
    postalCode: address.address?.postal_code,
    country: address.address?.country,
  };

  const normalized = Object.fromEntries(
    Object.entries(fields)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => [key, value.trim().slice(0, 200)]),
  );

  return Object.keys(normalized).length ? normalized : undefined;
}

export function buildPaidOrderRecord(session, lineItems, createdAt) {
  if (
    !session ||
    typeof session.id !== "string" ||
    !/^cs_(test|live)_[A-Za-z0-9_]+$/.test(session.id) ||
    session.mode !== "payment" ||
    session.status !== "complete" ||
    session.payment_status !== "paid" ||
    session.metadata?.application !== "ecommerce-store" ||
    !Number.isSafeInteger(session.amount_total) ||
    session.amount_total < 0 ||
    typeof session.currency !== "string" ||
    !/^[a-z]{3}$/.test(session.currency) ||
    !Array.isArray(lineItems) ||
    lineItems.length < 1 ||
    lineItems.length > MAX_ORDER_LINES
  ) {
    return null;
  }

  const normalizedItems = [];
  for (const [index, item] of lineItems.entries()) {
    const name = typeof item?.description === "string" ? item.description.trim() : "";
    const quantity = item?.quantity;
    const amountTotal = item?.amount_total;
    const currency = typeof item?.currency === "string" ? item.currency.toLowerCase() : session.currency;

    if (
      !name ||
      name.length > 250 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ITEM_QUANTITY ||
      !Number.isSafeInteger(amountTotal) ||
      amountTotal < 0 ||
      !/^[a-z]{3}$/.test(currency) ||
      currency !== session.currency
    ) {
      return null;
    }

    normalizedItems.push({
      _key: `line-${index + 1}`,
      name,
      quantity,
      amountTotal,
      currency,
    });
  }

  const rawEmail = session.customer_details?.email;
  const normalizedEmail = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const email = normalizedEmail && normalizedEmail.length <= 320
    ? normalizedEmail
    : undefined;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : undefined;
  const shippingAddress = normalizeAddress(session.shipping_details);
  const orderDate = new Date(createdAt);

  if (Number.isNaN(orderDate.getTime())) return null;

  return {
    _id: `stripe-${session.id}`,
    _type: "order",
    stripeSessionId: session.id,
    ...(paymentIntentId ? { paymentIntentId } : {}),
    ...(email ? { customerEmail: email } : {}),
    status: "paid",
    totalAmount: session.amount_total,
    currency: session.currency,
    createdAt: orderDate.toISOString(),
    lineItems: normalizedItems,
    ...(shippingAddress ? { shippingAddress } : {}),
  };
}
