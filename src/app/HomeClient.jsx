"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Gamepad2,
  Laptop,
  Smartphone,
  Truck,
} from "lucide-react";
import ProductCard from "@/components/store/product-card";

const quickCategories = [
  { label: "Mobile phones", href: "/products?category=Mobile", icon: Smartphone },
  { label: "PC & laptops", href: "/products?category=PC", icon: Laptop },
  { label: "Gaming consoles", href: "/products?category=Gaming%20Console", icon: Gamepad2 },
];

function normalizeBadge(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const key = raw.toLowerCase().replace(/\s+/g, " ");
  const aliases = {
    sale: "Sale",
    "best seller": "Best Seller",
    bestseller: "Best Seller",
    new: "New",
    trending: "Trending",
    "nice price": "Nice price",
    niceprice: "Nice price",
  };
  return aliases[key] || raw;
}

function groupProductsByBadge(list) {
  return list.reduce((acc, product) => {
    const badge = normalizeBadge(product.badge);
    if (!badge) return acc;
    if (!acc[badge]) acc[badge] = [];
    acc[badge].push(product);
    return acc;
  }, {});
}

export default function HomeClient({ products = [], featuredProducts, categories }) {
  const hasFeaturedProducts = Array.isArray(featuredProducts) && featuredProducts.length > 0;
  const badgeGroups = groupProductsByBadge(products);
  const preferredBadgeOrder = ["Sale", "Best Seller", "New", "Trending", "Nice price"];
  const badgeOrder = [
    ...preferredBadgeOrder,
    ...Object.keys(badgeGroups)
      .filter((badge) => !preferredBadgeOrder.includes(badge))
      .sort((a, b) => a.localeCompare(b)),
  ].filter((badge, index, list) => list.indexOf(badge) === index);

  const badgesWithProducts = badgeOrder.filter(
    (badge) => Array.isArray(badgeGroups[badge]) && badgeGroups[badge].length > 0,
  );

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="surface-panel overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-800 ring-1 ring-sky-100">
              <BadgePercent className="size-4 shrink-0" />
              Nice price deals
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
              <Truck className="size-4 text-slate-700" />
              Free shipping over $299
            </span>
          </div>

          <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            Phones, PCs, and gaming gear at everyday good prices.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Browse popular electronics, compare prices, add to cart, and checkout
            fast. Clean layout, marketplace style.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              Shop products <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/products?sort=featured"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
            >
              View featured
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {quickCategories.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <Icon className="size-5 text-slate-800" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Browse deals →
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="surface-panel rounded-3xl p-6 sm:p-7">
          <p className="text-xs font-semibold text-slate-900">Popular categories</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories
              .filter((category) => category !== "All")
              .slice(0, 10)
              .map((category) => (
                <Link
                  key={category}
                  href={`/products?category=${encodeURIComponent(category)}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  {category}
                </Link>
              ))}
            <Link
              href="/products"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
            >
              All products
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Deals of the week
            </p>
            <p className="mt-1 text-xs text-slate-600">
              New items are added frequently. Check back for price drops.
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                href="/products?sort=reviewed"
                className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                Most reviewed
              </Link>
              <Link
                href="/products?sort=priceLowHigh"
                className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                Best price
              </Link>
            </div>
          </div>
        </aside>
      </section>

      {badgesWithProducts.length > 0 ? (
        <div className="mt-10 space-y-10">
          {badgesWithProducts.map((badge) => {
            const railProducts = badgeGroups[badge].slice(0, 4);
            return (
              <section key={badge}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {badge}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 sm:text-base">
                      Hand-picked items tagged as {badge.toLowerCase()}.
                    </p>
                  </div>
                  <Link
                    href={`/products?badge=${encodeURIComponent(badge)}`}
                    className="shrink-0 text-sm font-semibold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {railProducts.map((product) => (
                    <ProductCard
                      key={`${badge}-${product.slug}`}
                      product={product}
                      compact
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      {hasFeaturedProducts ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Featured
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Popular picks across the store.
              </p>
            </div>
            <Link
              href="/products?sort=featured"
              className="shrink-0 text-sm font-semibold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Explore →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={`featured-${product.slug}`} product={product} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
