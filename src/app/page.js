import Image from "next/image";
import Link from "next/link";
import SiteHeroSection from "@/components/kinetic/site-hero-section";
import SiteKeyServicesSection from "@/components/kinetic/site-key-services-section";
import { formatCurrency } from "@/lib/store/cart";
import { listProductsByBadge } from "@/lib/store/products-service";
import { getSiteSettings } from "@/lib/site-settings-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [newProducts, siteSettings] = await Promise.all([
    listProductsByBadge("New", 4),
    getSiteSettings(),
  ]);

  return (
    <div>
      <SiteHeroSection settings={siteSettings} />
      <SiteKeyServicesSection settings={siteSettings} />
      <FeaturedProducts products={newProducts} />
      <Cta />
    </div>
  );
}

function FeaturedProducts({ products = [] }) {
  const featured = products.slice(0, 4);

  return (
    <section className="bg-zinc-950 py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 sm:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="block text-xs font-extrabold uppercase tracking-[0.25em] text-orange-200/90">
              Shop
            </span>
            <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              New arrivals
            </h2>
            <div className="kinetic-gradient mt-4 h-1 w-24" />
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
              Latest products tagged with the{" "}
              <span className="font-semibold text-zinc-300">New</span> badge —
              up to four at a time. See everything in the catalog.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex w-fit items-center gap-2 text-sm font-extrabold text-orange-300 transition hover:gap-3 md:self-end"
          >
            View all products
            <span aria-hidden>→</span>
          </Link>
        </div>

        {featured.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {featured.map((p) => {
              const slug = String(p.slug || "").trim();
              const href = slug ? `/products/${encodeURIComponent(slug)}` : "/products";
              const primary =
                Array.isArray(p.gallery) && p.gallery.length
                  ? String(p.gallery[0] || "").trim()
                  : "";
              const hasCompare =
                Number(p.compareAtPrice || 0) > Number(p.price || 0);

              return (
                <article
                  key={p._id || slug || p.name}
                  className="group flex flex-col rounded-xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/[0.07]"
                >
                  <Link href={href} className="block">
                    <div className="relative mb-6 aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/40">
                      {primary ? (
                        <Image
                          src={primary}
                          alt={p.name || "Product"}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold uppercase tracking-[0.25em] text-zinc-500">
                          No image
                        </div>
                      )}
                      <div className="absolute right-2 top-2 rounded bg-orange-500 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                        New
                      </div>
                    </div>
                  </Link>
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.25em] text-zinc-500">
                    {p.category || "—"}
                  </span>
                  <h3 className="mt-2 font-heading text-lg font-extrabold leading-snug text-zinc-50">
                    <Link
                      href={href}
                      className="transition hover:text-orange-200"
                    >
                      {p.name}
                    </Link>
                  </h3>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="font-heading text-xl font-extrabold text-orange-300">
                      {formatCurrency(p.price)}
                    </p>
                    {hasCompare ? (
                      <p className="text-sm text-zinc-500 line-through">
                        {formatCurrency(p.compareAtPrice)}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={href}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-800 px-4 py-3 text-sm font-black uppercase tracking-tight text-zinc-200 transition hover:bg-zinc-700"
                  >
                    View product
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
            <p className="text-sm text-zinc-400">
              No products with the{" "}
              <span className="font-semibold text-zinc-300">New</span> badge
              yet. Check the store for the full range.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-orange-300 transition hover:gap-3"
            >
              Browse all products
              <span aria-hidden>→</span>
            </Link>
          </div>
        )}

        <p className="mt-10 text-center text-sm text-zinc-500">
          Looking for something specific?{" "}
          <Link
            href="/products"
            className="font-semibold text-orange-300 underline-offset-4 transition hover:text-orange-200 hover:underline"
          >
            Browse the full product range
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div className="kinetic-gradient absolute inset-0 opacity-10" />
      <div className="relative z-10 mx-auto max-w-screen-2xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-black sm:text-5xl lg:text-6xl">
          READY FOR THE TRACK?
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg">
          Join the circle of drivers who demand more from their machines. Book
          your consultation today.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row sm:gap-6">
          <a
            href="/book-a-service"
            className="inline-flex items-center justify-center rounded-md bg-white px-10 py-5 text-sm font-black uppercase tracking-tight text-zinc-950 transition hover:bg-orange-500 hover:text-white"
          >
            Schedule Consultation
          </a>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-10 py-5 text-sm font-black uppercase tracking-tight text-white transition hover:bg-white/10"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
