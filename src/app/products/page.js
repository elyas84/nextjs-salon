import { Suspense } from "react";
import ProductsCatalog from "@/components/store/products-catalog";
import {
  getStoreCategoriesFromList,
  listProducts,
} from "@/lib/store/products-service";

export const dynamic = "force-dynamic";

function ProductsLoading() {
  return (
    <div className="mx-auto min-h-[50vh] max-w-screen-2xl px-4 py-24 text-center text-sm text-zinc-500">
      Loading products…
    </div>
  );
}

export default async function ProductsPage({ searchParams }) {
  const params = (await searchParams) || {};
  const products = await listProducts();
  const categories = getStoreCategoriesFromList(products);

  const requestedCategory = Array.isArray(params.category)
    ? params.category[0]
    : params.category || "All";
  const initialCategory = categories.includes(requestedCategory)
    ? requestedCategory
    : "All";
  const initialMinPrice = Array.isArray(params.minPrice)
    ? params.minPrice[0]
    : params.minPrice || "";
  const initialMaxPrice = Array.isArray(params.maxPrice)
    ? params.maxPrice[0]
    : params.maxPrice || "";
  const initialMinRating = Array.isArray(params.minRating)
    ? params.minRating[0]
    : params.minRating || "";
  const initialSort = Array.isArray(params.sort)
    ? params.sort[0]
    : params.sort || "featured";
  const initialInStockOnly = Array.isArray(params.inStockOnly)
    ? params.inStockOnly[0] === "true"
    : params.inStockOnly === "true";
  const initialQuery = Array.isArray(params.q) ? params.q[0] : params.q || "";
  const initialBadge = Array.isArray(params.badge)
    ? params.badge[0]
    : params.badge || "";

  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsCatalog
        products={products}
        categories={categories}
        initialCategory={initialCategory}
        initialQuery={initialQuery}
        initialBadge={initialBadge}
        initialMinPrice={initialMinPrice}
        initialMaxPrice={initialMaxPrice}
        initialMinRating={initialMinRating}
        initialSort={initialSort}
        initialInStockOnly={initialInStockOnly}
      />
    </Suspense>
  );
}
