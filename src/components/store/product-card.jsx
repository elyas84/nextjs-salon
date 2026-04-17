"use client";

import Link from "next/link";
import Image from "next/image";
import { ImageOff, Star, StarHalf, Tag } from "lucide-react";
import AddToCartButton from "@/components/store/add-to-cart-button";
import { formatCurrency } from "@/lib/store/cart";

export default function ProductCard({ product, compact = false }) {
  const primaryImage = Array.isArray(product.gallery) ? product.gallery[0] : "";
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
          "relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 shadow-lg shadow-black/20 transition-all duration-300",
          "hover:border-white/15 hover:shadow-xl hover:shadow-black/30",
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
            <div className="absolute left-0 top-0 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-900 shadow-sm">
              <Tag className="size-3.5 text-zinc-700" aria-hidden />
              Sale
            </div>
          ) : product.badge ? (
            <div className="absolute left-0 top-0 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-900 shadow-sm">
              <Tag className="size-3.5 text-zinc-700" aria-hidden />
              {product.badge}
            </div>
          ) : null}

          {hasDiscount && discountPercent > 0 ? (
            <div className="absolute right-0 top-0 z-10 flex size-10 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black leading-none text-white shadow-md">
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
              <div className="flex h-full w-full items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                <ImageOff className="size-4" />
                No image
              </div>
            )}
          </div>
        </div>

        <div className={compact ? "mt-4" : "mt-4"}>
          <p className="mb-1.5 text-xs font-medium text-zinc-400">
            {product.category || "—"}
          </p>
          <h3
            className={[
              "font-heading font-bold leading-snug text-zinc-50 transition-colors group-hover:text-orange-200",
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
                  "font-heading font-black tracking-tight text-zinc-50",
                  compact ? "text-xl" : "text-2xl",
                ].join(" ")}
              >
                {formatCurrency(product.price)}
              </p>
              {hasDiscount ? (
                <p className="mt-0.5 text-sm text-zinc-500 line-through">
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
                        className={`${iconClassName} text-zinc-600`}
                      />
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
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
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold uppercase tracking-wide text-zinc-100 transition hover:bg-white/10"
            >
              View details
            </Link>
            <AddToCartButton
              product={product}
              className="h-10 w-full rounded-xl border-0 !bg-gradient-to-r from-orange-500 to-orange-600 px-3 text-xs font-black uppercase tracking-wide !text-zinc-950 shadow-md shadow-orange-500/20 hover:!brightness-110"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
