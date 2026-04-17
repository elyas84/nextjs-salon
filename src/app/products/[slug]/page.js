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
  const ratingStars = displayRating ? getRatingStars(displayRating) : [];
  const breadcrumbItems = [
    { label: "Catalog", href: "/products" },
    ...(product.category
      ? [
          {
            label: product.category,
            href: `/products?category=${encodeURIComponent(product.category)}`,
          },
        ]
      : []),
    { label: product.name },
  ];
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
    <div className="min-h-screen bg-[#0a0908]">
      <section className="mx-auto w-full max-w-screen-2xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
        <section className="space-y-10">
          <ProductImageGallery
            images={Array.isArray(product.gallery) ? product.gallery : []}
            alt={product.name}
          />

          {product.description || product.shortDescription ? (
            <div className="surface-panel rounded-2xl border border-stone-800/60 bg-[#0c0b09]/80 p-5 sm:p-6">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <span className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-stone-100">
                    Product description
                  </span>
                  <ChevronDown
                    className="size-5 shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="mt-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-stone-400">
                    {product.description || product.shortDescription}
                  </p>
                </div>
              </details>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-stone-800/80 bg-[#0c0b09]/90 p-6 ring-1 ring-white/[0.04]">
              <Droplet className="mb-4 size-5 text-amber-500/90" />
              <h4 className="font-heading text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                Category
              </h4>
              <p className="mt-1 font-heading text-2xl font-semibold text-stone-50">
                {product.category || "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-800/80 bg-[#0c0b09]/90 p-6 ring-1 ring-white/[0.04]">
              <Gauge className="mb-4 size-5 text-amber-500/90" />
              <h4 className="font-heading text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                Availability
              </h4>
              <p className="mt-1 font-heading text-2xl font-semibold text-stone-50">
                {product.inStock ? "In stock" : "Unavailable"}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-800/80 bg-[#0c0b09]/90 p-6 ring-1 ring-white/[0.04]">
              <ShieldCheck className="mb-4 size-5 text-amber-500/90" />
              <h4 className="font-heading text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                Warranty
              </h4>
              <p className="mt-1 font-heading text-2xl font-semibold text-stone-50">
                12 months
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col">
          <div className="lg:sticky lg:top-32">
            <header className="mb-8">
              <h1 className="font-heading text-4xl font-semibold uppercase tracking-tight text-stone-50 sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-stone-400">
                {product.shortDescription ||
                  product.description ||
                  "Formulated for everyday care and salon-quality results at home."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {displayRating ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-950/50 px-3 py-1 text-xs text-stone-200">
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
                            className={`${iconClassName} text-stone-600`}
                          />
                        );
                      })}
                    </span>
                    <span className="font-semibold text-stone-50">
                      {Number(displayRating).toFixed(1)}
                    </span>
                    {displayReviews ? (
                      <span className="text-stone-500">({displayReviews})</span>
                    ) : null}
                  </div>
                ) : null}

                <div className="inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-950/50 px-3 py-1 text-xs text-stone-300">
                  <Clock className="size-3.5 text-stone-500" />
                  Ships in 1–2 days
                </div>
              </div>
            </header>

            <div className="mb-8 flex flex-wrap items-end gap-3">
              <span className="font-heading text-5xl font-semibold text-stone-50">
                {formatCurrency(product.price)}
              </span>
              {hasDiscount ? (
                <span className="mb-1 text-sm font-medium text-stone-500 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              ) : null}
              {hasDiscount && discountPercent > 0 ? (
                <span className="mb-1 inline-flex items-center rounded-md bg-amber-500/15 px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-amber-200">
                  <BadgePercent className="mr-1 inline size-4" />
                  Save {discountPercent}%
                </span>
              ) : null}
            </div>

            <div className="space-y-3">
              <AddToCartButton
                product={product}
                className="h-11 w-full rounded-xl border-0 !bg-gradient-to-r from-amber-500 to-amber-600 !px-4 !py-0 !text-sm !font-semibold uppercase !tracking-[0.06em] !text-stone-950 shadow-md shadow-amber-500/15 hover:!brightness-105"
              />
              <Link
                href="/checkout"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-600/70 bg-stone-950/50 px-4 text-xs font-semibold uppercase tracking-[0.1em] text-stone-200 transition hover:border-stone-500 hover:bg-stone-900/70 active:scale-[0.99]"
              >
                Express checkout <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-stone-800/80 bg-[#0c0b09]/90 p-6 ring-1 ring-white/[0.04]">
              <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 size-5 shrink-0 text-amber-500/90" />
                <div>
                  <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-stone-100">
                    Good to know
                  </h3>
                  <p className="mt-1 text-sm text-stone-400">
                    Suited to{" "}
                    <span className="text-amber-200/95">
                      your routine & hair type
                    </span>
                    . Ask your stylist if you are unsure.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-400/95 transition hover:text-amber-300 hover:underline"
                  >
                    Contact the salon
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      {Array.isArray(product.features) && product.features.length ? (
        <section className="mt-24">
          <h2 className="mb-10 flex items-center gap-4 font-heading text-2xl font-semibold uppercase tracking-tight text-stone-50 sm:text-3xl">
            Highlights
            <div className="h-px flex-1 bg-gradient-to-r from-stone-700/80 to-transparent" />
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {product.features.slice(0, 8).map((f) => (
              <div key={f} className="space-y-3">
                <h5 className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-500/90">
                  Detail
                </h5>
                <p className="text-sm leading-relaxed text-stone-400">{f}</p>
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
          <h2 className="mb-10 font-heading text-2xl font-semibold uppercase tracking-tight text-stone-50 sm:text-3xl">
            You may also like
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((item) => (
              <ProductCard key={item.slug} product={item} compact />
            ))}
          </div>
        </section>
      ) : null}
      </section>
    </div>
  );
}
