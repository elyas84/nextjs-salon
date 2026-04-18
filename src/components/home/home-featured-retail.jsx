import Image from "next/image";
import Link from "next/link";
import NoImage from "@/components/ui/NoImage";
import { isUsableImageUrl } from "@/lib/site-hero";
import { formatCurrency } from "@/lib/store/cart";

export default function HomeFeaturedRetail({ products = [] }) {
  const featured = products.slice(0, 4);
  const [first, ...rest] = featured;

  return (
    <section className="relative bg-[#080706] py-14 sm:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0c0b09] to-transparent" />

      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-lg">
            <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-stone-500">
              Take home
            </p>
            <h2 className="mt-2 font-heading text-[clamp(1.35rem,2.8vw,2rem)] font-semibold tracking-tight text-stone-100">
              New in the shop
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              A rotating edit of products tagged{" "}
              <span className="text-stone-300">New</span> — the same care we
              use at the basin, bottled for your routine.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-stone-700/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
          >
            Full shop
            <span aria-hidden className="text-lg leading-none">
              ↗
            </span>
          </Link>
        </div>

        {featured.length ? (
          <FeaturedProductGrid first={first} rest={rest} />
        ) : (
          <div className="mt-10 rounded-xl border border-dashed border-stone-800 bg-stone-900/30 px-5 py-12 text-center sm:mt-12">
            <p className="text-sm text-stone-500">
              Nothing tagged <span className="text-stone-300">New</span> yet.
              Browse the full range for what&apos;s in stock.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-rose-300/90"
            >
              Browse products
              <span aria-hidden>→</span>
            </Link>
          </div>
        )}

        {featured.length ? (
          <p className="mt-8 text-center text-sm text-stone-600 sm:mt-10">
            Need a recommendation?{" "}
            <Link
              href="/contact"
              className="font-medium text-stone-400 underline-offset-4 transition hover:text-amber-100/90 hover:underline"
            >
              Ask us at your visit
            </Link>{" "}
            or{" "}
            <Link
              href="/products"
              className="font-medium text-stone-400 underline-offset-4 transition hover:text-amber-100/90 hover:underline"
            >
              browse online
            </Link>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** Layouts avoid an empty cell when the hero spans 2×2 in a 4×2 grid. */
function FeaturedProductGrid({ first, rest }) {
  const n = first ? 1 + rest.length : 0;

  if (n <= 0) return null;

  if (n === 1) {
    return (
      <div className="mt-10 max-w-xs sm:mt-12 sm:max-w-sm">
        <FeaturedCard product={first} large />
      </div>
    );
  }

  if (n === 2) {
    return (
      <div className="mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:items-stretch sm:gap-4">
        <FeaturedCard product={first} large />
        <FeaturedCard product={rest[0]} />
      </div>
    );
  }

  if (n === 3) {
    return (
      <div className="mt-10 grid max-w-4xl grid-cols-1 gap-4 lg:mt-12 lg:grid-cols-2 lg:items-stretch lg:gap-6">
        <FeaturedCard product={first} large className="lg:min-h-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 lg:gap-4">
          {rest.map((p) => (
            <FeaturedCard key={p._id || p.slug || p.name} product={p} />
          ))}
        </div>
      </div>
    );
  }

  const [a, b, c] = rest;
  return (
    <div className="mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 lg:gap-5">
      <FeaturedCard
        product={first}
        large
        className="sm:col-span-2 lg:col-span-6 lg:row-span-2 lg:min-h-0"
      />
      <FeaturedCard
        product={a}
        className="lg:col-span-3 lg:col-start-7 lg:row-start-1"
      />
      <FeaturedCard
        product={b}
        className="lg:col-span-3 lg:col-start-10 lg:row-start-1"
      />
      <FeaturedCard
        product={c}
        className="sm:col-span-2 lg:col-span-6 lg:col-start-7 lg:row-start-2"
      />
    </div>
  );
}

function FeaturedCard({ product, className = "", large = false }) {
  const slug = String(product.slug || "").trim();
  const href = slug ? `/products/${encodeURIComponent(slug)}` : "/products";
  const rawPrimary =
    Array.isArray(product.gallery) && product.gallery.length
      ? String(product.gallery[0] || "").trim()
      : "";
  const primary =
    rawPrimary && isUsableImageUrl(rawPrimary) ? rawPrimary : "";
  const hasCompare =
    Number(product.compareAtPrice || 0) > Number(product.price || 0);

  return (
    <article
      className={`group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-stone-800/70 bg-[#0c0b09] shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] transition hover:border-stone-600/55 hover:shadow-[0_18px_44px_-28px_rgba(0,0,0,0.9)] ${className}`}
    >
      <div className="flex min-h-0 flex-1 flex-col p-3.5 sm:p-4">
        <Link
          href={href}
          className="relative block overflow-hidden rounded-lg bg-stone-900/50"
        >
          <div
            className={`relative w-full overflow-hidden ${
              large ? "aspect-[2/1] sm:aspect-[16/9]" : "aspect-[3/2]"
            }`}
          >
            {primary ? (
              <Image
                src={primary}
                alt={product.name || "Product"}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes={
                  large
                    ? "(max-width: 1024px) 100vw, 38vw"
                    : "(max-width: 640px) 100vw, 20vw"
                }
              />
            ) : (
              <NoImage
                fill
                tone="store"
                size="compact"
                className="rounded-none border-stone-800/50"
              />
            )}
            <span className="absolute left-2 top-2 rounded-full bg-stone-950/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-amber-100/95 ring-1 ring-white/10 backdrop-blur-sm">
              New
            </span>
          </div>
        </Link>

        <span className="mt-2.5 text-[9px] font-semibold uppercase tracking-[0.26em] text-stone-600">
          {product.category || "—"}
        </span>
        <h3
          className={`mt-1 font-heading text-base font-semibold leading-snug text-stone-100 sm:text-lg ${
            large ? "lg:text-xl" : ""
          }`}
        >
          <Link href={href} className="transition hover:text-amber-100/95">
            {product.name}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={`font-heading font-semibold text-amber-100/95 ${
              large ? "text-lg sm:text-xl" : "text-base sm:text-lg"
            }`}
          >
            {formatCurrency(product.price)}
          </span>
          {hasCompare ? (
            <span className="text-xs text-stone-600 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          ) : null}
        </div>

        <Link
          href={href}
          className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-stone-700/85 bg-white/[0.02] py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-300 transition group-hover:border-amber-500/25 group-hover:text-stone-100 sm:py-2.5"
        >
          View
        </Link>
      </div>
    </article>
  );
}
