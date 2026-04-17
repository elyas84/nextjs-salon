import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  ChevronDown,
  Clock,
  Droplet,
  Gauge,
  ShieldCheck,
  Star,
  StarHalf,
  Truck,
} from "lucide-react";
import AddToCartButton from "@/components/store/add-to-cart-button";
import Breadcrumbs from "@/components/store/breadcrumbs";
import ProductCard from "@/components/store/product-card";
import ProductImageGallery from "@/components/store/product-image-gallery";
import ProductReviewsSection from "@/components/store/product-reviews-section";
import { formatCurrency } from "@/lib/store/cart";
import {
  getProductBySlug,
  getRelatedProductsFromList,
  listProducts,
} from "@/lib/store/products-service";
import {
  getReviewSummary,
  listPublishedReviewsByProductId,
} from "@/lib/store/reviews-service";

export const dynamic = "force-dynamic";

function getRatingStars(rating) {
  const ratingValue = Math.max(0, Math.min(5, Number(rating) || 0));
  const displayRating = Math.round(ratingValue * 2) / 2;

  return Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;

    if (displayRating >= starNumber) {
      return "full";
    }

    if (displayRating >= starNumber - 0.5) {
      return "half";
    }

    return "empty";
  });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: product.name,
    description: product.description || product.shortDescription,
  };
}

export default async function ProductDetailsPage({ params }) {
  const { slug } = await params;
  const products = await listProducts();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProductsFromList(products, product);
  const [reviews, reviewSummary] = await Promise.all([
    listPublishedReviewsByProductId(product._id),
    getReviewSummary(product._id),
  ]);
  const displayRating =
    Number.isFinite(product.rating) && product.rating > 0
      ? product.rating
      : null;
  const displayReviews =
    Number.isFinite(product.reviews) && product.reviews > 0
      ? product.reviews
      : null;
  const displayStock = Number.isFinite(product.stockCount)
    ? product.stockCount
    : null;
  const ratingStars = displayRating ? getRatingStars(displayRating) : [];
  const hasDiscount =
    Number(product.compareAtPrice || 0) > Number(product.price || 0);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(product.compareAtPrice || 0) - Number(product.price || 0)) /
          Number(product.compareAtPrice || 1)) *
          100,
      )
    : 0;

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <nav
        className="mb-6 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-500 sm:mb-8 sm:text-xs sm:tracking-[0.25em]"
        aria-label="Breadcrumb"
      >
        <Link
          href="/products"
          className="max-w-[40vw] truncate transition-colors hover:text-orange-300 sm:max-w-none"
        >
          Catalog
        </Link>
        <span className="text-zinc-700" aria-hidden>
          /
        </span>
        <Link
          href={`/products?category=${encodeURIComponent(product.category)}`}
          className="max-w-[40vw] truncate transition-colors hover:text-orange-300 sm:max-w-none"
        >
          {product.category}
        </Link>
        <span className="text-zinc-700" aria-hidden>
          /
        </span>
        <span className="min-w-0 max-w-full truncate text-zinc-100">
          {product.name}
        </span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
        <section className="space-y-10">
          <ProductImageGallery
            images={Array.isArray(product.gallery) ? product.gallery : []}
            alt={product.name}
          />

          {product.description || product.shortDescription ? (
            <div className="surface-panel rounded-2xl p-5 sm:p-6">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <span className="font-heading text-sm font-black uppercase tracking-widest text-zinc-50">
                    Product description
                  </span>
                  <ChevronDown
                    className="size-5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="mt-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                    {product.description || product.shortDescription}
                  </p>
                </div>
              </details>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Droplet className="mb-4 size-5 text-orange-300" />
              <h4 className="font-heading text-xs font-black uppercase tracking-widest text-zinc-100">
                Category
              </h4>
              <p className="mt-1 font-heading text-2xl font-black text-zinc-50">
                {product.category || "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Gauge className="mb-4 size-5 text-orange-300" />
              <h4 className="font-heading text-xs font-black uppercase tracking-widest text-zinc-100">
                Availability
              </h4>
              <p className="mt-1 font-heading text-2xl font-black text-zinc-50">
                {product.inStock ? "In stock" : "Unavailable"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <ShieldCheck className="mb-4 size-5 text-orange-300" />
              <h4 className="font-heading text-xs font-black uppercase tracking-widest text-zinc-100">
                Warranty
              </h4>
              <p className="mt-1 font-heading text-2xl font-black text-zinc-50">
                12 months
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col">
          <div className="lg:sticky lg:top-32">
            <header className="mb-8">
              <h1 className="font-heading text-4xl font-black uppercase tracking-tighter text-zinc-50 sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-300">
                {product.shortDescription ||
                  product.description ||
                  "Engineered for drivers who demand precision performance."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {displayRating ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      {ratingStars.map((state, index) => {
                        const iconClassName = "size-3";
                        if (state === "full") {
                          return (
                            <Star
                              key={`detail-full-${index}`}
                              className={`${iconClassName} fill-current`}
                            />
                          );
                        }
                        if (state === "half") {
                          return (
                            <StarHalf
                              key={`detail-half-${index}`}
                              className={`${iconClassName} fill-current`}
                            />
                          );
                        }
                        return (
                          <Star
                            key={`detail-empty-${index}`}
                            className={`${iconClassName} text-zinc-700`}
                          />
                        );
                      })}
                    </span>
                    <span className="font-semibold text-zinc-50">
                      {Number(displayRating).toFixed(1)}
                    </span>
                    {displayReviews ? (
                      <span className="text-zinc-500">({displayReviews})</span>
                    ) : null}
                  </div>
                ) : null}

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
                  <Clock className="size-3.5 text-zinc-400" />
                  Ships in 1–2 days
                </div>
              </div>
            </header>

            <div className="mb-8 flex items-end gap-4">
              <span className="font-heading text-5xl font-black text-zinc-50">
                {formatCurrency(product.price)}
              </span>
              {hasDiscount ? (
                <span className="mb-1 text-sm font-semibold text-zinc-500 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              ) : null}
              {hasDiscount && discountPercent > 0 ? (
                <span className="mb-1 rounded-sm bg-orange-500/10 px-2 py-1 text-xs font-black uppercase tracking-widest text-orange-200">
                  <BadgePercent className="mr-1 inline size-4" />
                  Save {discountPercent}%
                </span>
              ) : null}
            </div>

            <div className="space-y-4">
              <AddToCartButton product={product} className="h-12 w-full" />
              <Link
                href="/checkout"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black uppercase tracking-widest text-zinc-100 transition hover:bg-white/10 active:scale-95"
              >
                Express checkout <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6">
              <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 size-5 text-sky-300" />
                <div>
                  <h3 className="font-heading text-sm font-black uppercase tracking-widest text-zinc-50">
                    Vehicle Compatibility
                  </h3>
                  <p className="mt-1 text-sm text-zinc-300">
                    Confirmed fit for:{" "}
                    <span className="text-sky-200">Your selected vehicle</span>
                  </p>
                  <button
                    type="button"
                    className="mt-3 text-[10px] font-black uppercase tracking-widest text-orange-300 hover:underline"
                  >
                    Change vehicle
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      {Array.isArray(product.features) && product.features.length ? (
        <section className="mt-24">
          <h2 className="mb-10 flex items-center gap-4 font-heading text-2xl font-black uppercase tracking-tighter text-zinc-50 sm:text-3xl">
            Engineering Details
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {product.features.slice(0, 8).map((f) => (
              <div key={f} className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-widest text-orange-300">
                  Feature
                </h5>
                <p className="text-sm leading-relaxed text-zinc-300">{f}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ProductReviewsSection
        productId={product._id}
        initialReviews={reviews}
        initialSummary={reviewSummary}
      />

      {relatedProducts.length > 0 ? (
        <section className="mt-24">
          <h2 className="mb-10 font-heading text-2xl font-black uppercase tracking-tighter text-zinc-50 sm:text-3xl">
            Related Precision Parts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((item) => (
              <ProductCard key={item.slug} product={item} compact />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
