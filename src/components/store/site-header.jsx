"use client";

import { Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Headset,
  Menu,
  Search,
  ShoppingBag,
  Store,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import ProductSearchSuggestionsDropdown from "@/components/store/product-search-suggestions-dropdown";
import { useStoreSearchSuggestions } from "@/hooks/use-store-search-suggestions";

const categories = [
  { label: "Mobile phones", href: "/products?category=Mobile" },
  { label: "PC & laptops", href: "/products?category=PC" },
  { label: "Gaming consoles", href: "/products?category=Gaming%20Console" },
  { label: "All products", href: "/products" },
];

const utilityLinks = [
  { label: "Customer service", href: "/contact", icon: Headset },
  { label: "Checkout", href: "/checkout" },
];

function ProductsSearchQuerySync({ setSearch }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/products") return;
    const q = searchParams.get("q");
    if (q == null || q === "") return;
    setSearch(q);
  }, [pathname, searchParams, setSearch]);

  return null;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, hydrated } = useCart();
  const [sessionUser, setSessionUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
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

  const loadSession = useCallback(async (cancelledRef) => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!cancelledRef?.current) {
        if (res.ok) {
          const data = await res.json();
          setSessionUser(data.user || null);
        } else {
          setSessionUser(null);
        }
        setAuthChecked(true);
      }
    } catch {
      if (!cancelledRef?.current) {
        setSessionUser(null);
        setAuthChecked(true);
      }
    }
  }, []);

  useEffect(() => {
    const cancelledRef = { current: false };

    const handleAuthChanged = () => {
      loadSession(cancelledRef);
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => loadSession(cancelledRef));
    } else {
      window.setTimeout(() => loadSession(cancelledRef), 0);
    }
    window.addEventListener("auth-changed", handleAuthChanged);
    window.addEventListener("pageshow", handleAuthChanged);

    return () => {
      cancelledRef.current = true;
      window.removeEventListener("auth-changed", handleAuthChanged);
      window.removeEventListener("pageshow", handleAuthChanged);
    };
  }, [loadSession]);

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

  const goToHeaderSuggestion = (index) => {
    const item = headerSuggestions[index];
    const slug = item && String(item.slug || "");
    if (!slug) return;
    setSearchChannel(null);
    setHeaderSearchHighlight(-1);
    setSearch("");
    router.push(`/products/${slug}`);
  };

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

    if (event.key === "Escape") {
      event.preventDefault();
      setSearchChannel(null);
      setHeaderSearchHighlight(-1);
    }
  };

  const accountHref =
    sessionUser?.role === "superadmin"
      ? "/admin"
      : sessionUser?.role === "client"
        ? "/dashboard"
        : "/login";

  const accountLabel =
    sessionUser?.role === "superadmin"
      ? "Admin"
      : sessionUser?.role === "client"
        ? "My account"
        : "Sign in";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <Suspense fallback={null}>
        <ProductsSearchQuerySync setSearch={setSearch} />
      </Suspense>
      <div className="hidden border-b border-slate-200 bg-white text-xs text-slate-600 md:block">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2">
            <Truck className="size-4 text-slate-700" />
            Free shipping over $299
          </div>
          <div className="flex items-center gap-4">
            {utilityLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 font-medium text-slate-600 hover:text-slate-900"
                >
                  {Icon ? <Icon className="size-4" /> : null}
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-2xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-colors hover:bg-slate-50 md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>

            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
                <Store className="size-5" />
              </span>
              <span className="brand-mark text-lg font-bold text-slate-900">
                eCom
              </span>
            </Link>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryMenuOpen((current) => !current)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
                aria-expanded={categoryMenuOpen}
                aria-haspopup="menu"
              >
                All categories <ChevronDown className="size-4" />
              </button>
              {categoryMenuOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
                >
                  <div className="p-2">
                    {categories.map((category) => (
                      <Link
                        key={category.href}
                        href={category.href}
                        className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        onClick={() => setCategoryMenuOpen(false)}
                      >
                        {category.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={desktopSearchWrapRef} className="relative w-130 shrink-0">
              <form
                className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm ring-slate-900/10 focus-within:ring-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const nextQuery = search.trim();
                  setSearchChannel(null);
                  setHeaderSearchHighlight(-1);
                  setSearch("");
                  router.push(
                    nextQuery ? `/products?q=${encodeURIComponent(nextQuery)}` : "/products",
                  );
                }}
              >
                <Search className="size-4 shrink-0 text-slate-500" aria-hidden />
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
                        setSearchChannel((c) => (c === "desktop" ? null : c));
                        setHeaderSearchHighlight(-1);
                      }
                    });
                  }}
                  onKeyDown={(e) => onHeaderSearchKeyDown(e, "desktop")}
                  placeholder="Search products"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls={desktopSearchListId}
                  aria-expanded={desktopSearchPanelOpen}
                  aria-activedescendant={
                    searchChannel === "desktop" && headerSearchHighlight >= 0
                      ? `${desktopSearchListId}-option-${headerSearchHighlight}`
                      : undefined
                  }
                  className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
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
                showEmpty={
                  !headerSearchLoading &&
                  trimmedHeaderSearch.length > 0 &&
                  headerSuggestions.length === 0
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authChecked ? (
              <Link
                href={accountHref}
                className={`hidden h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 md:inline-flex ${
                  pathname.startsWith(accountHref) ? "text-slate-900" : "text-slate-700"
                }`}
              >
                {accountLabel}
              </Link>
            ) : (
              <span className="hidden h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-400 shadow-sm md:inline-flex">
                ...
              </span>
            )}

            <Link
              href="/cart"
              className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {hydrated ? (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <div ref={mobileSearchWrapRef} className="relative mt-3 md:hidden">
          <form
            className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm ring-slate-900/10 focus-within:ring-2"
            onSubmit={(event) => {
              event.preventDefault();
              const nextQuery = search.trim();
              setSearchChannel(null);
              setHeaderSearchHighlight(-1);
              setSearch("");
              router.push(
                nextQuery ? `/products?q=${encodeURIComponent(nextQuery)}` : "/products",
              );
              setMobileMenuOpen(false);
            }}
          >
            <Search className="size-4 shrink-0 text-slate-500" aria-hidden />
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
                    !mobileSearchWrapRef.current?.contains(document.activeElement)
                  ) {
                    setSearchChannel((c) => (c === "mobile" ? null : c));
                    setHeaderSearchHighlight(-1);
                  }
                });
              }}
              onKeyDown={(e) => onHeaderSearchKeyDown(e, "mobile")}
              placeholder="Search products"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={mobileSearchListId}
              aria-expanded={mobileSearchPanelOpen}
              aria-activedescendant={
                searchChannel === "mobile" && headerSearchHighlight >= 0
                  ? `${mobileSearchListId}-option-${headerSearchHighlight}`
                  : undefined
              }
              className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Search
            </button>
          </form>
          <ProductSearchSuggestionsDropdown
            id={mobileSearchListId}
            open={mobileSearchPanelOpen}
            suggestions={headerSuggestions}
            highlightedIndex={headerSearchHighlight}
            onHighlight={setHeaderSearchHighlight}
            loading={headerSearchLoading}
            showEmpty={
              !headerSearchLoading &&
              trimmedHeaderSearch.length > 0 &&
              headerSuggestions.length === 0
            }
          />
        </div>
      </div>

      <div
        id="mobile-navigation"
        className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
      >
        <div className="mx-auto w-full max-w-screen-2xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="surface-panel rounded-3xl p-4">
            <div className="grid gap-2">
              <div className="pb-2 text-xs font-semibold text-slate-900">
                Categories
              </div>
              {categories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
                >
                  {category.label}
                </Link>
              ))}

              {authChecked ? (
                <Link
                  href={accountHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`mt-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    pathname.startsWith(accountHref)
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {accountLabel}
                </Link>
              ) : (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                  Checking session...
                </div>
              )}

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  pathname.startsWith("/contact")
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                Customer service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
