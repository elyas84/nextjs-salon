import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/store/cart";

export default function HomeFeaturedRetail({ products = [] }) {
  const featured = products.slice(0, 4);
  const [first, ...rest] = featured;

  return (
    <section className="relative bg-[#080706] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0c0b09] to-transparent" />

      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-stone-500">
              Take home
            </p>
            <h2 className="mt-4 font-heading text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight text-stone-100">
              New in the shop
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-stone-500">
              A rotating edit of products tagged{" "}
              <span className="text-stone-300">New</span> — the same care we
              use at the basin, bottled for your routine.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-700/80 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
          >
            Full shop
            <span aria-hidden className="text-lg leading-none">
              ↗
            </span>
          </Link>
        </div>

        {featured.length ? (
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:gap-6">
            {first ? (
              <FeaturedCard
                product={first}
                className="lg:col-span-2 lg:row-span-2 lg:min-h-[420px]"
                large
              />
            ) : null}
            {rest.map((p) => (
              <FeaturedCard key={p._id || p.slug || p.name} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-14 rounded-2xl border border-dashed border-stone-800 bg-stone-900/30 px-6 py-16 text-center">
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
          <p className="mt-12 text-center text-sm text-stone-600">
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

function FeaturedCard({ product, className = "", large = false }) {
  const slug = String(product.slug || "").trim();
  const href = slug ? `/products/${encodeURIComponent(slug)}` : "/products";
  const primary =
    Array.isArray(product.gallery) && product.gallery.length
      ? String(product.gallery[0] || "").trim()
      : "";
  const hasCompare =
    Number(product.compareAtPrice || 0) > Number(product.price || 0);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-stone-800/80 bg-gradient-to-b from-stone-900/40 to-[#0a0908] p-1 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)] transition hover:border-stone-700/90 ${className}`}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.9rem] bg-[#0a0908]/90 p-5 sm:p-6">
        <Link href={href} className="relative block overflow-hidden rounded-xl ring-1 ring-white/[0.05]">
          <div
            className={`relative w-full overflow-hidden bg-stone-900/50 ${
              large ? "aspect-[16/11] sm:aspect-[16/10]" : "aspect-[4/3]"
            }`}
          >
            {primary ? (
              <Image
                src={primary}
                alt={product.name || "Product"}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                sizes={
                  large
                    ? "(max-width: 1024px) 100vw, 50vw"
                    : "(max-width: 640px) 100vw, 25vw"
                }
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-600">
                No image
              </div>
            )}
            <span className="absolute left-3 top-3 rounded-full bg-stone-950/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-100/95 ring-1 ring-white/10 backdrop-blur-sm">
              New
            </span>
          </div>
        </Link>

        <span className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-600">
          {product.category || "—"}
        </span>
        <h3 className="mt-2 font-heading text-lg font-semibold leading-snug text-stone-100 sm:text-xl">
          <Link href={href} className="transition hover:text-amber-100/95">
            {product.name}
          </Link>
        </h3>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-heading text-xl font-semibold text-amber-100/95">
            {formatCurrency(product.price)}
          </span>
          {hasCompare ? (
            <span className="text-sm text-stone-600 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          ) : null}
        </div>

        <Link
          href={href}
          className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-stone-700/90 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-300 transition group-hover:border-stone-500 group-hover:text-stone-100"
        >
          View
        </Link>
      </div>
    </article>
  );
}
