"use client";

import Link from "next/link";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BadgeCheck,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductSearchSuggestionsDropdown from "@/components/store/product-search-suggestions-dropdown";
import { useStoreSearchSuggestions } from "@/hooks/use-store-search-suggestions";
import { useCart } from "@/components/store/cart-provider";

const navItems = [
  { label: "Services", href: "/services" },
  { label: "Products", href: "/products" },
  { label: "Booking", href: "/book-a-service" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function ProductsSearchQuerySync({ setSearch }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname?.startsWith("/products")) return;
    const q = searchParams.get("q");
    if (q == null || q === "") return;
    setSearch(q);
  }, [pathname, searchParams, setSearch]);

  return null;
}

function SiteHeaderFallback() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-zinc-950/60 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
        <div className="h-7 w-36 animate-pulse rounded-lg bg-white/10" />
      </div>
    </header>
  );
}

function SiteHeaderInner() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = useMemo(() => navItems, []);
  const pathname = usePathname() || "/";
  const { itemCount, hydrated } = useCart();

  const [search, setSearch] = useState("");
  const desktopSearchWrapRef = useRef(null);
  const mobileSearchWrapRef = useRef(null);
  const desktopSearchListId = useId();
  const mobileSearchListId = useId();
  const [searchChannel, setSearchChannel] = useState(null);
  const [headerSearchHighlight, setHeaderSearchHighlight] = useState(-1);
  const { suggestions: headerSuggestions, loading: headerSearchLoading } =
    useStoreSearchSuggestions(search);

  const trimmedHeaderSearch = search.trim();
  const headerPanelOpenBase = trimmedHeaderSearch.length > 0;
  const desktopSearchPanelOpen =
    searchChannel === "desktop" && headerPanelOpenBase;
  const mobileSearchPanelOpen =
    searchChannel === "mobile" && headerPanelOpenBase;

  useEffect(() => {
    setHeaderSearchHighlight(-1);
  }, [search]);

  useEffect(() => {
    if (!searchChannel || !headerPanelOpenBase) return undefined;

    const onPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const inDesktop = desktopSearchWrapRef.current?.contains(target);
      const inMobile = mobileSearchWrapRef.current?.contains(target);
      if (inDesktop || inMobile) return;
      setSearchChannel(null);
      setHeaderSearchHighlight(-1);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [searchChannel, headerPanelOpenBase]);

  const goToHeaderSuggestion = useCallback(
    (index) => {
      const item = headerSuggestions[index];
      const slug = item && String(item.slug || "");
      if (!slug) return;
      setSearchChannel(null);
      setHeaderSearchHighlight(-1);
      router.push(`/products/${slug}`);
    },
    [headerSuggestions, router],
  );

  const onHeaderSearchKeyDown = (event, channel) => {
    if (searchChannel !== channel) return;
    if (!trimmedHeaderSearch) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (headerSuggestions.length === 0) return;
      setHeaderSearchHighlight((i) =>
        i < headerSuggestions.length - 1 ? i + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (headerSuggestions.length === 0) return;
      setHeaderSearchHighlight((i) =>
        i <= 0 ? headerSuggestions.length - 1 : i - 1,
      );
      return;
    }

    if (event.key === "Enter" && headerSearchHighlight >= 0) {
      event.preventDefault();
      goToHeaderSuggestion(headerSearchHighlight);
      return;
    }

    if (event.key === "Enter" && headerSearchHighlight < 0) {
      event.preventDefault();
      const nextQuery = trimmedHeaderSearch;
      router.push(
        nextQuery
          ? `/products?q=${encodeURIComponent(nextQuery)}`
          : "/products",
      );
      setSearchChannel(null);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSearchChannel(null);
      setHeaderSearchHighlight(-1);
    }
  };

  const isActive = (href) => {
    if (!href) return false;
    if (href === "/") return pathname === "/";
    if (href === "/products") {
      return pathname === "/products" || pathname.startsWith("/products/");
    }
    return pathname === href;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-zinc-950/60 backdrop-blur-xl">
      <Suspense fallback={null}>
        <ProductsSearchQuerySync setSearch={setSearch} />
      </Suspense>

      <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100 transition-colors hover:bg-white/10 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link
              href="/"
              aria-label="FixPro home"
              className="group inline-flex min-w-0 items-center font-heading text-xl font-extrabold tracking-tight text-zinc-50 transition sm:text-2xl"
            >
              <span className="tracking-tight leading-none group-hover:text-white">
                Fix<span className="text-orange-400">Pro</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors",
                      active
                        ? "text-orange-400"
                        : "text-zinc-400 hover:text-zinc-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex md:max-w-xl lg:max-w-md">
            <div ref={desktopSearchWrapRef} className="relative w-full min-w-0">
              <form
                className="flex h-11 w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 shadow-sm ring-white/10 focus-within:ring-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const nextQuery = search.trim();
                  router.push(
                    nextQuery
                      ? `/products?q=${encodeURIComponent(nextQuery)}`
                      : "/products",
                  );
                  setSearchChannel(null);
                }}
              >
                <Search
                  className="size-4 shrink-0 text-zinc-500"
                  aria-hidden
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onFocus={() => {
                    setSearchChannel("desktop");
                    setHeaderSearchHighlight(-1);
                  }}
                  onBlur={() => {
                    window.requestAnimationFrame(() => {
                      if (
                        !desktopSearchWrapRef.current?.contains(
                          document.activeElement,
                        )
                      ) {
                        setSearchChannel((c) =>
                          c === "desktop" ? null : c,
                        );
                        setHeaderSearchHighlight(-1);
                      }
                    });
                  }}
                  onKeyDown={(e) => onHeaderSearchKeyDown(e, "desktop")}
                  placeholder="Search products…"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls={desktopSearchListId}
                  aria-expanded={desktopSearchPanelOpen}
                  aria-activedescendant={
                    searchChannel === "desktop" && headerSearchHighlight >= 0
                      ? `${desktopSearchListId}-option-${headerSearchHighlight}`
                      : undefined
                  }
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  className="kinetic-gradient shrink-0 rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-wide text-zinc-950 transition hover:brightness-110"
                >
                  Search
                </button>
              </form>
              <ProductSearchSuggestionsDropdown
                id={desktopSearchListId}
                open={desktopSearchPanelOpen}
                suggestions={headerSuggestions}
                highlightedIndex={headerSearchHighlight}
                onHighlight={setHeaderSearchHighlight}
                loading={headerSearchLoading}
                variant="dark"
                showEmpty={
                  !headerSearchLoading &&
                  trimmedHeaderSearch.length > 0 &&
                  headerSuggestions.length === 0
                }
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100 transition-colors hover:bg-white/10"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {hydrated && itemCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow-[0_0_0_2px_rgba(9,9,11,0.9)]"
                  aria-label={`${itemCount} items in cart`}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100 transition-colors hover:bg-white/10"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div ref={mobileSearchWrapRef} className="relative mt-3 md:hidden">
          <form
            className="flex h-11 w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 shadow-sm ring-white/10 focus-within:ring-2"
            onSubmit={(event) => {
              event.preventDefault();
              const nextQuery = search.trim();
              router.push(
                nextQuery
                  ? `/products?q=${encodeURIComponent(nextQuery)}`
                  : "/products",
              );
              setOpen(false);
              setSearchChannel(null);
            }}
          >
            <Search className="size-4 shrink-0 text-zinc-500" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => {
                setSearchChannel("mobile");
                setHeaderSearchHighlight(-1);
              }}
              onBlur={() => {
                window.requestAnimationFrame(() => {
                  if (
                    !mobileSearchWrapRef.current?.contains(
                      document.activeElement,
                    )
                  ) {
                    setSearchChannel((c) => (c === "mobile" ? null : c));
                    setHeaderSearchHighlight(-1);
                  }
                });
              }}
              onKeyDown={(e) => onHeaderSearchKeyDown(e, "mobile")}
              placeholder="Search products…"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={mobileSearchListId}
              aria-expanded={mobileSearchPanelOpen}
              aria-activedescendant={
                searchChannel === "mobile" && headerSearchHighlight >= 0
                  ? `${mobileSearchListId}-option-${headerSearchHighlight}`
                  : undefined
              }
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            <button
              type="submit"
              className="kinetic-gradient shrink-0 rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-wide text-zinc-950"
            >
              Go
            </button>
          </form>
          <ProductSearchSuggestionsDropdown
            id={mobileSearchListId}
            open={mobileSearchPanelOpen}
            suggestions={headerSuggestions}
            highlightedIndex={headerSearchHighlight}
            onHighlight={setHeaderSearchHighlight}
            loading={headerSearchLoading}
            variant="dark"
            showEmpty={
              !headerSearchLoading &&
              trimmedHeaderSearch.length > 0 &&
              headerSuggestions.length === 0
            }
          />
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl md:hidden">
          <nav className="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6">
            <div className="grid gap-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={[
                    "rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors",
                    isActive(item.href)
                      ? "border-orange-500/30 bg-orange-500/10 text-orange-200"
                      : "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10",
                  ].join(" ")}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderFallback />}>
      <SiteHeaderInner />
    </Suspense>
  );
}
