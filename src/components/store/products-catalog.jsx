"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import Breadcrumbs from "@/components/store/breadcrumbs";
import ProductCard from "@/components/store/product-card";
import { productMatchesStoreQuery } from "@/lib/store/product-search";
import { formatCurrency } from "@/lib/store/cart";

const PRODUCTS_PAGE_SIZE = 6;

/** Page numbers plus ellipsis gaps (e.g. 1, 2, 3, …, 12). */
function buildPaginationItems(current, total) {
  if (total <= 1) return [1];
  const delta = 2;
  const pages = new Set([1, total]);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function ProductsCatalog({
  products,
  categories,
  initialCategory = "All",
  initialMinPrice = "",
  initialMaxPrice = "",
  initialQuery = "",
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [selectedCategories, setSelectedCategories] = useState(() => {
    if (initialCategory && initialCategory !== "All") return [initialCategory];
    return [];
  });
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const searchQuery = useMemo(() => {
    if (searchParams.has("q")) {
      return String(searchParams.get("q") ?? "").trim();
    }
    return String(initialQuery || "").trim();
  }, [searchParams, initialQuery]);

  useEffect(() => {
    setActiveCategory(initialCategory);
    setSelectedCategories(
      initialCategory && initialCategory !== "All" ? [initialCategory] : [],
    );
  }, [initialCategory]);

  useEffect(() => {
    setMinPrice(initialMinPrice);
  }, [initialMinPrice]);

  useEffect(() => {
    setMaxPrice(initialMaxPrice);
  }, [initialMaxPrice]);

  const priceBounds = useMemo(() => {
    const prices = products.map((product) => Number(product.price || 0)).filter(Number.isFinite);
    const min = prices.length ? Math.floor(Math.min(...prices)) : 0;
    const max = prices.length ? Math.ceil(Math.max(...prices)) : 1000;
    return {
      min,
      max: Math.max(max, min + 1),
    };
  }, [products]);

  const minPriceValue = minPrice === "" ? priceBounds.min : Number(minPrice);
  const maxPriceValue = maxPrice === "" ? priceBounds.max : Number(maxPrice);
  const normalizedMinPrice = Number.isFinite(minPriceValue) ? minPriceValue : priceBounds.min;
  const normalizedMaxPrice = Number.isFinite(maxPriceValue) ? maxPriceValue : priceBounds.max;
  const sliderMin = Math.min(normalizedMinPrice, normalizedMaxPrice);
  const sliderMax = Math.max(normalizedMinPrice, normalizedMaxPrice);

  const priceSpan = Math.max(priceBounds.max - priceBounds.min, 1);
  const rangeFillLeft =
    ((sliderMin - priceBounds.min) / priceSpan) * 100;
  const rangeFillWidth =
    ((sliderMax - sliderMin) / priceSpan) * 100;

  useEffect(() => {
    if (normalizedMinPrice > normalizedMaxPrice) {
      setMinPrice(String(normalizedMaxPrice));
      setMaxPrice(String(normalizedMinPrice));
    }
  }, [normalizedMaxPrice, normalizedMinPrice]);

  const clampPrice = (n) =>
    Math.min(
      Math.max(Math.round(Number(n)), priceBounds.min),
      priceBounds.max,
    );

  const onMinNumberChange = (event) => {
    const v = event.target.valueAsNumber;
    if (Number.isNaN(v)) return;
    const next = clampPrice(v);
    setMinPrice(String(Math.min(next, sliderMax)));
  };

  const onMaxNumberChange = (event) => {
    const v = event.target.valueAsNumber;
    if (Number.isNaN(v)) return;
    const next = clampPrice(v);
    setMaxPrice(String(Math.max(next, sliderMin)));
  };

  const onMinRangeInput = (event) => {
    const next = clampPrice(event.target.value);
    setMinPrice(String(Math.min(next, sliderMax)));
  };

  const onMaxRangeInput = (event) => {
    const next = clampPrice(event.target.value);
    setMaxPrice(String(Math.max(next, sliderMin)));
  };

  const minInputValue =
    minPrice === ""
      ? sliderMin
      : Number.isFinite(Number(minPrice))
        ? Number(minPrice)
        : sliderMin;
  const maxInputValue =
    maxPrice === ""
      ? sliderMax
      : Number.isFinite(Number(maxPrice))
        ? Number(maxPrice)
        : sliderMax;

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);
      const derivedBrand =
        String(product.name || "").trim().split(/\s+/)[0] || "";
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(derivedBrand);
      const matchesMinPrice =
        Number(product.price || 0) >= sliderMin;
      const matchesMaxPrice =
        Number(product.price || 0) <= sliderMax;
      const matchesSearch = productMatchesStoreQuery(product, searchQuery);

      return (
        matchesCategory &&
        matchesBrand &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesSearch
      );
    });
    return filtered;
  }, [
    products,
    selectedBrands,
    selectedCategories,
    sliderMax,
    sliderMin,
    searchQuery,
  ]);

  const filtersMountRef = useRef(true);
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  // Drop `page` from the URL when filters or store search change. `searchParams` is read
  // via a ref so this effect does not re-run on every URL change (e.g. ?page=2), which
  // would strip `page` and break pagination.
  useEffect(() => {
    if (filtersMountRef.current) {
      filtersMountRef.current = false;
      return;
    }
    const params = new URLSearchParams(searchParamsRef.current.toString());
    if (params.has("page")) {
      params.delete("page");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }
  }, [
    pathname,
    router,
    selectedCategories,
    selectedBrands,
    sliderMin,
    sliderMax,
    searchQuery,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PAGE_SIZE),
  );
  const urlPage = Math.max(
    1,
    Number.parseInt(String(searchParams.get("page") ?? "1"), 10) || 1,
  );
  const currentPage = Math.min(urlPage, totalPages);

  useEffect(() => {
    if (urlPage === currentPage) return;
    const params = new URLSearchParams(searchParams.toString());
    if (currentPage <= 1) params.delete("page");
    else params.set("page", String(currentPage));
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [currentPage, pathname, router, searchParams, urlPage]);

  const pageStart = filteredProducts.length
    ? (currentPage - 1) * PRODUCTS_PAGE_SIZE + 1
    : 0;
  const pageEnd = Math.min(
    filteredProducts.length,
    currentPage * PRODUCTS_PAGE_SIZE,
  );
  const paginatedProducts = useMemo(
    () =>
      filteredProducts.slice(
        (currentPage - 1) * PRODUCTS_PAGE_SIZE,
        currentPage * PRODUCTS_PAGE_SIZE,
      ),
    [filteredProducts, currentPage],
  );

  const goToPage = (next) => {
    const p = Math.max(1, Math.min(next, totalPages));
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: true });
  };

  const clearFilters = () => {
    setActiveCategory("All");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
  ];

  if (activeCategory !== "All") {
    breadcrumbItems.push({ label: activeCategory });
  }

  const sidebarCategories = Array.isArray(categories)
    ? categories.filter((c) => c !== "All")
    : [];

  const derivedBrands = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const brand = String(p?.name || "").trim().split(/\s+/)[0];
      if (brand) set.add(brand);
    });
    return Array.from(set).slice(0, 12);
  }, [products]);

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <div className="hidden md:block">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <header className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-orange-300">
            Engineered Inventory
          </p>
          <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tighter text-zinc-50 sm:text-5xl md:text-6xl">
            PRECISION <span className="text-zinc-500">COMPONENTS</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-300 sm:text-base">
            Every part is a performance statement. Explore our curated selection
            of high-end automotive essentials designed for the discerning
            enthusiast.
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-3 sm:max-w-md sm:items-end">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              {filteredProducts.length} result
              {filteredProducts.length === 1 ? "" : "s"}
              {filteredProducts.length > 0 && totalPages > 1 ? (
                <span className="text-zinc-600">
                  {" "}
                  · {pageStart}–{pageEnd}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 font-semibold text-zinc-300 hover:text-white"
            >
              <X className="size-3.5" />
              Clear
            </button>
          </div>
        </div>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12">
        <aside className="space-y-10 lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-100 shadow-sm lg:hidden"
              aria-expanded={filtersOpen}
            >
              <span className="inline-flex items-center gap-2">
                <Filter className="size-4" />
                Filters
              </span>
              <ChevronDown
                className={`size-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <div className={filtersOpen ? "block" : "hidden lg:block"}>
            <div className="grid gap-10">
                <div>
                  <h3 className="mb-6 text-sm font-extrabold uppercase tracking-widest text-zinc-100">
                    Category
                  </h3>
                  <div className="space-y-3">
                    {sidebarCategories.map((category) => {
                      const checked = selectedCategories.includes(category);
                      return (
                        <label
                          key={category}
                          className="group flex cursor-pointer items-center"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setSelectedCategories((prev) => {
                                const next = new Set(prev);
                                if (event.target.checked) next.add(category);
                                else next.delete(category);
                                const list = Array.from(next);
                                setActiveCategory(list[0] || "All");
                                return list;
                              });
                            }}
                            className="rounded-sm border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/40 focus:ring-offset-zinc-950"
                          />
                          <span
                            className={[
                              "ml-3 text-sm transition-colors",
                              checked
                                ? "text-zinc-100"
                                : "text-zinc-400 group-hover:text-zinc-100",
                            ].join(" ")}
                          >
                            {category}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-100">
                      Price range
                    </h3>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-400">
                      {formatCurrency(sliderMin)} – {formatCurrency(sliderMax)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        Min
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        step={1}
                        value={minInputValue}
                        onChange={onMinNumberChange}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm tabular-nums text-zinc-100 outline-none transition focus:border-orange-500/45 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        Max
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        step={1}
                        value={maxInputValue}
                        onChange={onMaxNumberChange}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm tabular-nums text-zinc-100 outline-none transition focus:border-orange-500/45 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </label>
                  </div>
                  <div className="relative mt-6 pb-1">
                    <div
                      className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-lg bg-white/10"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-lg bg-orange-500/70"
                      style={{
                        left: `${rangeFillLeft}%`,
                        width: `${rangeFillWidth}%`,
                      }}
                      aria-hidden
                    />
                    <div className="relative h-9">
                      <input
                        type="range"
                        aria-label="Minimum price"
                        className="price-slider price-range-dual price-range-min absolute inset-x-0 top-1/2 w-full -translate-y-1/2 cursor-pointer bg-transparent"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        step={1}
                        value={sliderMin}
                        onInput={onMinRangeInput}
                        onChange={onMinRangeInput}
                      />
                      <input
                        type="range"
                        aria-label="Maximum price"
                        className="price-slider price-range-dual price-range-max absolute inset-x-0 top-1/2 w-full -translate-y-1/2 cursor-pointer bg-transparent"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        step={1}
                        value={sliderMax}
                        onInput={onMaxRangeInput}
                        onChange={onMaxRangeInput}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between gap-2 text-xs tabular-nums text-zinc-500">
                    <span>{formatCurrency(priceBounds.min)}</span>
                    <span>{formatCurrency(priceBounds.max)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-6 text-sm font-extrabold uppercase tracking-widest text-zinc-100">
                    Brand
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {derivedBrands.map((brand) => {
                      const active = selectedBrands.includes(brand);
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => {
                            setSelectedBrands((prev) => {
                              const next = new Set(prev);
                              if (next.has(brand)) next.delete(brand);
                              else next.add(brand);
                              return Array.from(next);
                            });
                          }}
                          className={[
                            "rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-tighter transition-colors",
                            active
                              ? "bg-zinc-200 text-zinc-950"
                              : "bg-white/5 text-zinc-300 hover:bg-white/10",
                          ].join(" ")}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9">
          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
              {totalPages > 1 ? (
                <nav
                  className="mt-12 flex flex-col items-center gap-3 border-t border-white/10 pt-8"
                  aria-label="Product list pagination"
                >
                  <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      aria-label="Previous page"
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="size-5" aria-hidden />
                    </button>

                    {buildPaginationItems(currentPage, totalPages).map(
                      (item, idx) =>
                        item === "ellipsis" ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-1.5 text-sm text-zinc-500 select-none"
                            aria-hidden
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => goToPage(item)}
                            aria-label={`Page ${item}`}
                            aria-current={
                              item === currentPage ? "page" : undefined
                            }
                            className={[
                              "min-w-10 rounded-lg px-2 py-2 text-sm transition",
                              item === currentPage
                                ? "font-bold text-zinc-50"
                                : "text-zinc-500 hover:text-zinc-300",
                            ].join(" ")}
                          >
                            {item}
                          </button>
                        ),
                    )}

                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      aria-label="Next page"
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="size-5" aria-hidden />
                    </button>
                  </div>
                </nav>
              ) : null}
            </>
          ) : (
            <div className="surface-panel rounded-3xl p-8 text-center text-zinc-400">
              {products.length === 0
                ? "No products available yet. Please check back soon."
                : "No products match your search. Try a different keyword or category."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
