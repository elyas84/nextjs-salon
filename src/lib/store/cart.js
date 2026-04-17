export const CART_STORAGE_KEY = "voltmart:cart";
export const LAST_ORDER_KEY = "voltmart:last-order";
export const PENDING_CHECKOUT_KEY = "voltmart:pending-checkout";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value) {
  return currencyFormatter.format(value);
}

export function safeParse(jsonValue, fallback) {
  if (!jsonValue) return fallback;

  try {
    return JSON.parse(jsonValue);
  } catch {
    return fallback;
  }
}

export function normalizeCartItem(item) {
  const gallery = Array.isArray(item.gallery) ? item.gallery : [];
  const firstUrl = gallery.map((u) => String(u || "").trim()).find(Boolean);
  const image = String(
    firstUrl || item.image || item.imageUrl || "",
  ).trim();

  return {
    slug: String(item.slug),
    name: String(item.name || ""),
    category: String(item.category || ""),
    image,
    price: Number(item.price || 0),
    compareAtPrice: Number(item.compareAtPrice || item.price || 0),
    quantity: Number(item.quantity || 1),
    stockCount:
      item.stockCount == null || item.stockCount === ""
        ? null
        : Number(item.stockCount),
    shortDescription: String(item.shortDescription || item.description || ""),
    badge: String(item.badge || ""),
    accent: String(item.accent || ""),
  };
}

function calculateShipping(subtotal, delivery = "standard") {
  if (subtotal === 0) return 0;

  if (delivery === "express") {
    return 9.99;
  }

  return 4.99;
}

export function calculateCartTotals(items, delivery = "standard") {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const shipping = calculateShipping(subtotal, delivery);
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
  };
}

export function buildOrderNumber() {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `VM-${Date.now().toString().slice(-6)}-${suffix}`;
}
