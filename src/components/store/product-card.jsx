"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, StarHalf, Tag } from "lucide-react";
import AddToCartButton from "@/components/store/add-to-cart-button";
import NoImage from "@/components/ui/NoImage";
import { isUsableImageUrl } from "@/lib/site-hero";
import { formatCurrency } from "@/lib/store/cart";

export default function ProductCard({ product, compact = false }) {
  const rawGallery = Array.isArray(product.gallery) ? product.gallery[0] : "";
  const primaryImage =
    rawGallery && isUsableImageUrl(String(rawGallery).trim())
      ? String(rawGallery).trim()
      : "";
  const ratingValue = Math.max(0, Math.min(5, Number(product.rating) || 0));
  const displayRating = Math.round(ratingValue * 2) / 2;
  const stars = Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;

    if (displayRating >= starNumber) {
      return "full";
    }

    if (displayRating >= starNumber - 0.5) {
      return "half";
    }

    return "empty";
  });

  const hasDiscount =
    Number(product.compareAtPrice || 0) > Number(product.price || 0);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(product.compareAtPrice || 0) - Number(product.price || 0)) /
          Number(product.compareAtPrice || 1)) *
          100,
      )
    : 0;

  const reviewCount = Number(product.reviews) || 0;

  return (
    <article className="group">
      <div
        className={[
          "relative overflow-hidden rounded-2xl border border-stone-800/80 bg-[#0c0b09]/90 shadow-lg shadow-black/25 transition-all duration-300 ring-1 ring-white/[0.04]",
          "hover:border-stone-700 hover:shadow-xl hover:shadow-black/35",
          compact ? "p-4" : "p-4",
        ].join(" ")}
      >
        {/* Image — no frame bg/border; smaller contained shot */}
        <div
          className={[
            "relative mx-auto flex items-center justify-center",
            compact ? "h-36 sm:h-40" : "h-40 sm:h-44",
          ].join(" ")}
        >
          {hasDiscount && discountPercent > 0 ? (
            <div className="absolute left-0 top-0 z-10 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-900 shadow-sm">
              <Tag className="size-3.5 text-stone-600" aria-hidden />
              Sale
            </div>
          ) : product.badge ? (
            <div className="absolute left-0 top-0 z-10 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-900 shadow-sm">
              <Tag className="size-3.5 text-stone-600" aria-hidden />
              {product.badge}
            </div>
          ) : null}

          {hasDiscount && discountPercent > 0 ? (
            <div className="absolute right-0 top-0 z-10 flex size-10 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold leading-none text-stone-950 shadow-md">
              -{discountPercent}%
            </div>
          ) : null}

          <div className="relative h-full w-full max-w-[12rem] sm:max-w-[13.5rem]">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={product.name}
                loading="eager"
                fill
                sizes="(max-width: 768px) 100vw, 200px"
                className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <NoImage
                fill
                tone="store"
                size="compact"
                className="rounded-xl border-stone-800/60"
              />
            )}
          </div>
        </div>

        <div className={compact ? "mt-4" : "mt-4"}>
          <p className="mb-1.5 text-xs font-medium text-stone-500">
            {product.category || "—"}
          </p>
          <h3
            className={[
              "font-heading font-semibold leading-snug text-stone-50 transition-colors group-hover:text-amber-100/95",
              // Keep card heights consistent with long names.
              "line-clamp-2 min-h-[2.6em]",
              compact ? "text-base" : "text-lg",
            ].join(" ")}
          >
            {product.name}
          </h3>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={[
                  "font-heading font-semibold tracking-tight text-stone-50",
                  compact ? "text-xl" : "text-2xl",
                ].join(" ")}
              >
                {formatCurrency(product.price)}
              </p>
              {hasDiscount ? (
                <p className="mt-0.5 text-sm text-stone-500 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </p>
              ) : null}
            </div>

            {compact ? null : (
              <div className="shrink-0 text-right">
                <div className="flex justify-end gap-0.5 text-amber-500">
                  {stars.map((state, index) => {
                    const iconClassName = "size-3.5";
                    if (state === "full") {
                      return (
                        <Star
                          key={`full-${index}`}
                          className={`${iconClassName} fill-current`}
                        />
                      );
                    }
                    if (state === "half") {
                      return (
                        <StarHalf
                          key={`half-${index}`}
                          className={`${iconClassName} fill-current`}
                        />
                      );
                    }
                    return (
                      <Star
                        key={`empty-${index}`}
                        className={`${iconClassName} text-stone-600`}
                      />
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </p>
              </div>
            )}
          </div>

          <div
            className={[
              "mt-3 grid gap-2",
              // Keep actions in one row even for compact cards (e.g. related products).
              "grid-cols-2",
            ].join(" ")}
          >
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex h-9 min-h-0 items-center justify-center rounded-xl border border-stone-600/70 bg-stone-950/50 px-2.5 text-[10px] font-medium uppercase leading-none tracking-[0.1em] text-stone-200 transition hover:border-stone-500 hover:bg-stone-900/70"
            >
              View details
            </Link>
            <AddToCartButton
              product={product}
              iconClassName="size-3.5 shrink-0"
              className="h-9 min-h-0 w-full rounded-xl border-0 !bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 !text-[10px] !font-medium uppercase !leading-none !tracking-[0.1em] !text-stone-950 shadow-md shadow-amber-500/15 hover:!brightness-105"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
