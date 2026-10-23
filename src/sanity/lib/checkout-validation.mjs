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
      productId.trim() !== productId ||
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

export async function readLimitedBody(stream, maxBytes) {
  if (
    !stream ||
    typeof stream.getReader !== "function" ||
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 0
  ) {
    return { ok: false, reason: "invalid" };
  }

  const reader = stream.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (!(value instanceof Uint8Array)) {
        try {
          await reader.cancel();
        } catch {}
        return { ok: false, reason: "invalid" };
      }

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {}
        return { ok: false, reason: "too-large" };
      }

      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "invalid" };
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      ok: true,
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
