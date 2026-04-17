/**
 * Rank products for storefront search autocomplete (name-first, then description/category).
 * @param {Array<{ name?: string, shortDescription?: string, description?: string, category?: string, slug?: string }>} products
 * @param {string} rawQuery
 * @param {number} limit
 * @returns {typeof products}
 */
export function computeProductSearchSuggestions(products, rawQuery, limit = 8) {
  const q = String(rawQuery || "").trim().toLowerCase();
  if (!q || !Array.isArray(products) || products.length === 0) return [];

  const scored = [];
  for (const product of products) {
    const name = String(product.name || "").toLowerCase();
    const hay = `${name} ${String(product.description || "").toLowerCase()} ${String(product.shortDescription || "").toLowerCase()} ${String(product.category || "").toLowerCase()}`;
    if (!hay.includes(q)) continue;

    let rank = 3;
    if (name.startsWith(q)) rank = 0;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) rank = 1;
    else if (name.includes(q)) rank = 2;

    scored.push({ rank, product });
  }

  scored.sort(
    (a, b) =>
      a.rank - b.rank ||
      String(a.product.name || "").localeCompare(String(b.product.name || ""), undefined, {
        sensitivity: "base",
      }),
  );

  const seen = new Set();
  const out = [];
  for (const { product } of scored) {
    const slug = String(product.slug || "");
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(product);
    if (out.length >= limit) break;
  }
  return out;
}

/** Whether a product should appear when the storefront `q` filter is applied. */
export function productMatchesStoreQuery(product, rawQuery) {
  const q = String(rawQuery || "").trim().toLowerCase();
  if (!q) return true;
  const hay = `${String(product?.name || "")} ${String(product?.description || "")} ${String(product?.shortDescription || "")} ${String(product?.category || "")} ${String(product?.slug || "")}`.toLowerCase();
  return hay.includes(q);
}
