import { NextResponse } from "next/server";
import { listProducts } from "@/lib/store/products-service";
import { computeProductSearchSuggestions } from "@/lib/store/product-search";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limitRaw = Number(searchParams.get("limit") || "8");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(20, Math.max(1, Math.floor(limitRaw)))
    : 8;

  if (!q.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const products = await listProducts();
    const matches = computeProductSearchSuggestions(products, q, limit);
    const suggestions = matches.map((p) => ({
      name: p.name,
      slug: p.slug,
      category: p.category,
      price: p.price,
    }));
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Store search error:", err);
    return NextResponse.json(
      { error: "Could not load suggestions" },
      { status: 500 },
    );
  }
}
