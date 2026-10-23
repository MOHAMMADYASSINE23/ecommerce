export const MAX_CART_LINES = 50;
export const MAX_ITEM_QUANTITY = 99;

export function normalizeCart(body) {
  if (!Array.isArray(body) || body.length === 0 || body.length > MAX_CART_LINES) {
    return null;
  }

  const quantities = new Map();

  for (const item of body) {
    const productId =
      typeof item?._id === "string"
        ? item._id
        : typeof item?.productId === "string"
          ? item.productId
          : "";
    const quantity = item?.quantity;

    if (
      !productId ||
      productId.length > 128 ||
      productId.startsWith("drafts.") ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ITEM_QUANTITY
    ) {
      return null;
    }

    const combinedQuantity = (quantities.get(productId) ?? 0) + quantity;
    if (combinedQuantity > MAX_ITEM_QUANTITY) return null;
    quantities.set(productId, combinedQuantity);
  }

  return [...quantities.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}
