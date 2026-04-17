"use client";

import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/store/cart";

function suggestionImageUrl(item) {
  const direct = String(item.image || "").trim();
  if (direct) return direct;
  const g = item.gallery;
  if (Array.isArray(g) && g[0]) return String(g[0]).trim();
  return "";
}

/**
 * @param {{
 *   id: string,
 *   open: boolean,
 *   suggestions: Array<{ name?: string, slug?: string, category?: string, price?: number, image?: string, gallery?: string[] }>,
 *   highlightedIndex: number,
 *   onHighlight: (index: number) => void,
 *   loading?: boolean,
 *   showEmpty?: boolean,
 *   emptyLabel?: string,
 *   className?: string,
 *   variant?: "light" | "dark",
 *   onNavigate?: () => void,
 * }} props
 */
export default function ProductSearchSuggestionsDropdown({
  id,
  open,
  suggestions,
  highlightedIndex,
  onHighlight,
  onNavigate,
  loading = false,
  showEmpty = false,
  emptyLabel = "No matching products",
  className = "",
  variant = "light",
}) {
  if (!open) return null;

  const listClasses =
    variant === "dark"
      ? "absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 py-1 shadow-xl backdrop-blur-xl"
      : "absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg";

  if (loading && suggestions.length === 0) {
    return (
      <div
        id={id}
        role="listbox"
        className={`${listClasses} ${className}`.trim()}
        aria-busy="true"
      >
        <div
          className={
            variant === "dark"
              ? "px-3 py-2.5 text-xs text-zinc-400"
              : "px-3 py-2.5 text-xs text-slate-500"
          }
        >
          Searching…
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    if (!showEmpty) return null;
    return (
      <div id={id} role="listbox" className={`${listClasses} ${className}`.trim()}>
        <div
          className={
            variant === "dark"
              ? "px-3 py-2.5 text-xs text-zinc-500"
              : "px-3 py-2.5 text-xs text-slate-500"
          }
        >
          {emptyLabel}
        </div>
      </div>
    );
  }

  return (
    <ul
      id={id}
      role="listbox"
      className={`${listClasses} ${className}`.trim()}
    >
      {suggestions.map((item, index) => {
        const slug = String(item.slug || "");
        if (!slug) return null;
        const active = index === highlightedIndex;
        const thumb = suggestionImageUrl(item);
        const name = String(item.name || "Product");
        return (
          <li key={slug} role="presentation">
            <Link
              href={`/products/${slug}`}
              role="option"
              id={`${id}-option-${index}`}
              aria-selected={active}
              onClick={() => onNavigate?.()}
              className={`flex items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                variant === "dark"
                  ? active
                    ? "bg-white/10 text-zinc-50"
                    : "text-zinc-200 hover:bg-white/5"
                  : active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-800 hover:bg-slate-50"
              }`}
              onMouseEnter={() => onHighlight(index)}
              onMouseDown={(event) => event.preventDefault()}
            >
              <span
                className={`relative mt-0.5 size-10 shrink-0 overflow-hidden rounded-lg border ${
                  variant === "dark"
                    ? "border-white/10 bg-zinc-800/80"
                    : "border-slate-200 bg-slate-100"
                }`}
              >
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={name}
                    width={40}
                    height={40}
                    className="size-10 object-cover"
                    sizes="40px"
                  />
                ) : (
                  <span className="flex size-10 items-center justify-center">
                    <Package
                      className={
                        variant === "dark" ? "size-4 text-zinc-500" : "size-4 text-slate-400"
                      }
                      aria-hidden
                    />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-medium leading-snug ${
                    variant === "dark" ? "text-zinc-50" : "text-slate-900"
                  }`}
                >
                  {name}
                </span>
                <span
                  className={
                    variant === "dark" ? "mt-0.5 block text-xs text-zinc-400" : "mt-0.5 block text-xs text-slate-500"
                  }
                >
                  {item.category || "Product"}
                  {item.price != null && Number.isFinite(Number(item.price))
                    ? ` · ${formatCurrency(Number(item.price))}`
                    : ""}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
