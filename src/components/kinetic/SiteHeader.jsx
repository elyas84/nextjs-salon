"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductSearchSuggestionsDropdown from "@/components/store/product-search-suggestions-dropdown";
import { useStoreSearchSuggestions } from "@/hooks/use-store-search-suggestions";
import { useCart } from "@/components/store/cart-provider";

const navItems = [
  { label: "Services", href: "/services" },
  { label: "Booking", href: "/book-a-service" },
  { label: "Products", href: "/products" },
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-800/60 bg-[#0a0908]/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] w-full max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
        <div className="h-7 w-36 animate-pulse rounded-full bg-stone-800/60" />
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset highlight when query changes
    setHeaderSearchHighlight(-1);
  }, [search]);

  const [menuMotionEnter, setMenuMotionEnter] = useState(false);
  const mobileMenuPanelRef = useRef(null);

  const closeMobileMenuAnimated = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setOpen(false);
      setSearchChannel(null);
      setHeaderSearchHighlight(-1);
      return;
    }
    setMenuMotionEnter(false);
  }, []);

  const onMobileMenuTransitionEnd = useCallback(
    (event) => {
      if (event.target !== mobileMenuPanelRef.current) return;
      if (!["opacity", "transform"].includes(event.propertyName)) return;
      if (menuMotionEnter) return;
      if (!open) return;
      setOpen(false);
      setSearchChannel(null);
      setHeaderSearchHighlight(-1);
    },
    [menuMotionEnter, open],
  );

  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- menu open/close animation gate */
    if (!open) {
      setMenuMotionEnter(false);
      return;
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setMenuMotionEnter(true);
      return;
    }
    setMenuMotionEnter(false);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setMenuMotionEnter(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenuAnimated();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeMobileMenuAnimated]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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

  const clearHeaderSearchUi = useCallback(() => {
    setSearch("");
    setHeaderSearchHighlight(-1);
    setSearchChannel(null);
  }, []);

  const goToHeaderSuggestion = useCallback(
    (index) => {
      const item = headerSuggestions[index];
      const slug = item && String(item.slug || "");
      if (!slug) return;
      clearHeaderSearchUi();
      router.push(`/products/${slug}`);
    },
    [headerSuggestions, router, clearHeaderSearchUi],
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

  const navLinkClass = (active) =>
    [
      "text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors",
      active
        ? "text-amber-100/95"
        : "text-stone-500 hover:text-stone-200",
    ].join(" ");

  const navPillClass = (active) =>
    [
      "rounded-full px-3 py-2 transition-colors",
      active
        ? "bg-stone-100/[0.09] text-amber-100/95 ring-1 ring-amber-400/20"
        : "hover:bg-white/[0.04]",
    ].join(" ");

  const [menuPortalReady, setMenuPortalReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount gate for portal SSR
    setMenuPortalReady(true);
  }, []);

  const mobileSearchForm = (wrapperClassName) => (
    <div ref={mobileSearchWrapRef} className={wrapperClassName}>
      <form
        className="flex h-12 w-full items-center gap-2 rounded-full border border-stone-600/70 bg-stone-900/50 px-3 transition-[border-color] focus-within:border-amber-500/40 focus-within:ring-1 focus-within:ring-amber-500/20"
        onSubmit={(event) => {
          event.preventDefault();
          const nextQuery = search.trim();
          router.push(
            nextQuery
              ? `/products?q=${encodeURIComponent(nextQuery)}`
              : "/products",
          );
          closeMobileMenuAnimated();
          setSearchChannel(null);
        }}
      >
        <Search className="size-4 shrink-0 text-stone-400" aria-hidden />
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
          className="min-w-0 flex-1 bg-transparent text-base text-stone-100 outline-none placeholder:text-stone-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-stone-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-950 transition hover:bg-amber-50"
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
        onNavigate={clearHeaderSearchUi}
        loading={headerSearchLoading}
        variant="dark"
        className="mt-2 border-stone-600/80 bg-[#141210]/98 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)]"
        showEmpty={
          !headerSearchLoading &&
          trimmedHeaderSearch.length > 0 &&
          headerSuggestions.length === 0
        }
      />
    </div>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-800/60 bg-[#0a0908]/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#0a0908]/65">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/20 to-transparent"
        aria-hidden
      />
      <Suspense fallback={null}>
        <ProductsSearchQuerySync setSearch={setSearch} />
      </Suspense>

      <div className="mx-auto w-full max-w-screen-2xl px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-6">
            <button
              type="button"
              className={[
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-stone-200 transition-[transform,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-stone-600 hover:bg-stone-800/50 active:scale-[0.96] md:hidden",
                open
                  ? "border-amber-500/35 bg-amber-500/10 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]"
                  : "border-stone-700/60 bg-stone-900/40",
              ].join(" ")}
              onClick={() => {
                if (open) closeMobileMenuAnimated();
                else setOpen(true);
              }}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? (
                <X className="h-5 w-5 transition-transform duration-300 ease-out" />
              ) : (
                <Menu className="h-5 w-5 transition-transform duration-300 ease-out" />
              )}
            </button>

            <Link
              href="/"
              aria-label="Studio Salon home"
              className="group inline-flex min-w-0 items-center font-heading text-xl font-semibold tracking-tight text-stone-100 transition sm:text-2xl"
            >
              <span className="leading-none tracking-tight group-hover:text-stone-50">
                Studio{" "}
                <span className="text-amber-200/95 group-hover:text-amber-100">
                  Salon
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:gap-1.5 md:flex">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`${navLinkClass(active)} ${navPillClass(active)}`}
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
                className="flex h-11 w-full items-center gap-2 rounded-full border border-stone-700/60 bg-stone-900/35 px-3 shadow-none transition-[border-color,box-shadow] focus-within:border-amber-500/30 focus-within:ring-1 focus-within:ring-amber-500/15"
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
                  className="size-4 shrink-0 text-stone-500"
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
                  className="min-w-0 flex-1 bg-transparent text-sm text-stone-200 outline-none placeholder:text-stone-500"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-stone-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-950 transition hover:bg-amber-50"
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
                onNavigate={clearHeaderSearchUi}
                loading={headerSearchLoading}
                variant="dark"
                className="mt-1.5 border-stone-700/70 bg-[#141210]/96 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)]"
                showEmpty={
                  !headerSearchLoading &&
                  trimmedHeaderSearch.length > 0 &&
                  headerSuggestions.length === 0
                }
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-700/60 bg-stone-900/40 text-stone-200 transition-colors hover:border-stone-600 hover:bg-stone-800/50"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {hydrated && itemCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-stone-950 shadow-[0_0_0_2px_#0a0908]"
                  aria-label={`${itemCount} items in cart`}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-700/60 bg-stone-900/40 text-stone-200 transition-colors hover:border-stone-600 hover:bg-stone-800/50"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {!open ? mobileSearchForm("relative mt-3 md:hidden") : null}
      </div>

      {menuPortalReady && open
        ? createPortal(
            <div
              ref={mobileMenuPanelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              onTransitionEnd={onMobileMenuTransitionEnd}
              className={[
                "fixed inset-0 z-[200] flex min-h-0 flex-col bg-[#0a0908] md:hidden",
                "transform-gpu will-change-[opacity,transform]",
                "transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-reduce:transition-none motion-reduce:duration-0",
                menuMotionEnter
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-3 opacity-0 motion-reduce:translate-y-0",
              ].join(" ")}
              style={{
                minHeight: "100dvh",
                paddingTop: "max(0.5rem, env(safe-area-inset-top))",
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/25 to-transparent" />

              <div
                className={[
                  "flex shrink-0 items-center justify-between gap-4 border-b border-stone-800/80 px-4 pb-4 pt-1",
                  "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  menuMotionEnter
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
                ].join(" ")}
                style={{
                  transitionDelay: menuMotionEnter ? "35ms" : "0ms",
                }}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
                  Menu
                </span>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-600/70 bg-stone-900/60 text-stone-100 transition-[transform,background-color,border-color] duration-200 hover:border-stone-500 hover:bg-stone-800/70 active:scale-95"
                  onClick={closeMobileMenuAnimated}
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" strokeWidth={1.75} />
                </button>
              </div>

              <div
                className={[
                  "shrink-0 px-4 pt-4",
                  "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  menuMotionEnter
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
                ].join(" ")}
                style={{
                  transitionDelay: menuMotionEnter ? "70ms" : "0ms",
                }}
              >
                {mobileSearchForm("relative")}
              </div>

              <nav
                className={[
                  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2",
                  "transition-[opacity] duration-500 ease-out motion-reduce:transition-none",
                  menuMotionEnter ? "opacity-100" : "opacity-0 motion-reduce:opacity-100",
                ].join(" ")}
                style={{
                  transitionDelay: menuMotionEnter ? "110ms" : "0ms",
                }}
                aria-label="Primary"
              >
                <ul className="flex flex-col gap-0.5">
                  {items.map((item, index) => {
                    const active = isActive(item.href);
                    return (
                      <li
                        key={item.href}
                        className={[
                          "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                          menuMotionEnter
                            ? "translate-x-0 opacity-100"
                            : "-translate-x-2 opacity-0 motion-reduce:translate-x-0 motion-reduce:opacity-100",
                        ].join(" ")}
                        style={{
                          transitionDelay: menuMotionEnter
                            ? `${120 + index * 42}ms`
                            : "0ms",
                        }}
                      >
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={[
                            "block rounded-xl px-4 py-4 font-heading text-2xl font-medium leading-tight tracking-tight transition-colors duration-200 sm:text-[1.65rem]",
                            active
                              ? "bg-amber-500/15 text-amber-50 ring-1 ring-amber-400/30"
                              : "text-stone-100 hover:bg-white/[0.06] hover:text-white",
                          ].join(" ")}
                          onClick={closeMobileMenuAnimated}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div
                className={[
                  "shrink-0 border-t border-stone-800/80 px-4 pb-1 pt-4",
                  "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  menuMotionEnter
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
                ].join(" ")}
                style={{
                  transitionDelay: menuMotionEnter ? "200ms" : "0ms",
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/cart"
                    className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl border border-stone-600/60 bg-stone-900/50 px-3 text-sm font-semibold text-stone-100 transition-colors duration-200 hover:border-stone-500 hover:bg-stone-800/60"
                    onClick={closeMobileMenuAnimated}
                  >
                    <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
                    Cart
                    {hydrated && itemCount > 0 ? (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-stone-950">
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    ) : null}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl border border-stone-600/60 bg-stone-900/50 px-3 text-sm font-semibold text-stone-100 transition-colors duration-200 hover:border-stone-500 hover:bg-stone-800/60"
                    onClick={closeMobileMenuAnimated}
                  >
                    <User className="h-5 w-5 shrink-0" aria-hidden />
                    Account
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
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
