import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import { maybeNotifyLowStock } from "@/lib/low-stock-notifier";

const normalizeProduct = (product) => ({
  _id: String(product._id),
  name: String(product.name || ""),
  slug: String(product.slug || ""),
  category: String(product.category || ""),
  price: Number(product.price || 0),
  compareAtPrice: Number(product.compareAtPrice || 0),
  badge:
    String(product.badge || "").trim() === "Discount"
      ? "Sale"
      : String(product.badge || ""),
  rating: Number(product.rating || 0),
  reviews: Number(product.reviews || 0),
  description: String(product.description || product.shortDescription || ""),
  shortDescription: String(
    product.shortDescription || product.description || "",
  ),
  gallery: Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery
    : String(product.coverImage || "").trim()
      ? [String(product.coverImage || "").trim()]
      : [],
  features: Array.isArray(product.features) ? product.features : [],
  inStock: Boolean(product.inStock),
  stockCount: Number(product.stockCount || 0),
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const normalizeInput = (body) => {
  const name = String(body.name || "").trim();
  const slug =
    String(body.slug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const features = Array.isArray(body.features)
    ? body.features.map((item) => String(item).trim()).filter(Boolean)
    : String(body.features || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

  const description = String(body.description || "").trim();
  const shortFromBody = String(body.shortDescription || "").trim();

  return {
    name,
    slug,
    category: String(body.category || "").trim(),
    price: Number(body.price || 0),
    compareAtPrice: Number(body.compareAtPrice || 0),
    badge: String(body.badge || "").trim(),
    description,
    shortDescription: shortFromBody || description.slice(0, 280),
    gallery: Array.isArray(body.gallery)
      ? body.gallery.map((item) => String(item).trim()).filter(Boolean)
      : String(body.gallery || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
    features,
    inStock: Boolean(body.inStock),
    stockCount: Number(body.stockCount || 0),
  };
};

export async function listProducts() {
  await connectDB();
  const docs = await Product.find({}).sort({ updatedAt: -1 }).lean();
  return docs.map(normalizeProduct);
}

/**
 * Products with an exact badge match (e.g. "New", "Sale"), newest first.
 */
export async function listProductsByBadge(badge, limit = 4) {
  await connectDB();
  const b = String(badge || "").trim();
  if (!b) return [];
  const cap = Math.max(1, Math.min(48, Number(limit) || 4));
  const docs = await Product.find({ badge: b })
    .sort({ updatedAt: -1 })
    .limit(cap)
    .lean();
  return docs.map(normalizeProduct);
}

export async function getProductBySlug(slug) {
  await connectDB();
  const doc = await Product.findOne({ slug }).lean();
  return doc ? normalizeProduct(doc) : null;
}

export async function createProduct(body) {
  await connectDB();
  const input = normalizeInput(body);

  if (!input.name) {
    throw new Error("Product name is required");
  }

  if (!input.slug) {
    throw new Error("Product slug is required");
  }

  const product = await Product.create(input);
  return normalizeProduct(product.toObject());
}

export async function updateProduct(id, body) {
  await connectDB();
  const input = normalizeInput(body);
  const existingProduct = await Product.findById(id).lean();

  if (!input.name) {
    throw new Error("Product name is required");
  }

  if (!input.slug) {
    throw new Error("Product slug is required");
  }

  const product = await Product.findByIdAndUpdate(
    id,
    {
      $set: {
        ...input,
        rating: existingProduct?.rating ?? 0,
        reviews: existingProduct?.reviews ?? 0,
      },
      $unset: { coverImage: 1 },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!product) return null;

  const existingStockCount = existingProduct?.stockCount;
  const nextStockCount = product.stockCount;

  // Reset notification when restocked.
  if (
    Number(existingStockCount ?? NaN) < 5 &&
    Number(nextStockCount ?? NaN) >= 5 &&
    product.lowStockNotified
  ) {
    product.lowStockNotified = false;
    await product.save();
  }

  // Notify when crossing below threshold. Mark as notified when email is sent.
  try {
    const result = await maybeNotifyLowStock({
      product,
      previousStockCount: existingStockCount,
    });
    if (result?.action === "emailed") {
      product.lowStockNotified = true;
      await product.save();
    }
  } catch (err) {
    console.error("Low stock notify failed:", err);
  }

  return normalizeProduct(product.toObject());
}

export async function deleteProduct(id) {
  await connectDB();
  return Product.findByIdAndDelete(id);
}

export function normalizeProductInput(body) {
  return normalizeInput(body);
}

export function getStoreCategoriesFromList(list) {
  return ["All", ...new Set(list.map((product) => product.category))];
}

export function getFeaturedProductsFromList(list) {
  return list.slice(0, 4);
}

export function getRelatedProductsFromList(list, product, limit = 3) {
  return list
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, limit);
}
