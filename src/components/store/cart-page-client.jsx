"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import NoImage from "@/components/ui/NoImage";
import { isUsableImageUrl } from "@/lib/site-hero";
import {
  authPrimaryButtonClass,
  storePanelClass,
} from "@/lib/auth-page-styles";
import { formatCurrency } from "@/lib/store/cart";

export default function CartPageClient() {
  const { items, updateQuantity, removeItem, totals } = useCart();

  if (items.length === 0) {
    return (
      <div className="relative border-b border-stone-800/50 bg-[#0a0908]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(244,114,182,0.06),transparent_55%)]" />
        <section className="relative mx-auto flex min-h-[55vh] w-full max-w-screen-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className={`${storePanelClass} w-full max-w-lg p-8 sm:p-10`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
              Cart
            </p>
            <h1 className="mt-4 font-heading text-2xl font-semibold text-stone-100 sm:text-3xl">
              Your bag is empty
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Browse shampoos, styling tools, and care we use at the basin —
              add something you love to get started.
            </p>
            <Link
              href="/products"
              className={`${authPrimaryButtonClass} mt-8 w-full sm:w-auto`}
            >
              Browse products <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative border-b border-stone-800/50 bg-[#0a0908]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_-10%,rgba(253,230,138,0.06),transparent_55%)]" />
      <section className="relative mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
            Cart
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-stone-100 sm:text-4xl">
            Your cart
          </h1>
          <p className="mt-3 text-sm text-stone-500 sm:text-base">
            Review quantities, then continue to shipping and payment.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr] lg:gap-8">
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const lineTotal =
                Number(item.price || 0) * Number(item.quantity || 0);
              const atCap =
                Number.isFinite(Number(item.stockCount)) &&
                Number(item.stockCount) > 0 &&
                item.quantity >= Number(item.stockCount);
              const hasCompare =
                Number(item.compareAtPrice || 0) > Number(item.price || 0);
              const compareLine =
                hasCompare &&
                Number(item.compareAtPrice || 0) * Number(item.quantity || 0);

              const thumbOk =
                item.image && isUsableImageUrl(String(item.image).trim());

              return (
                <li key={item.slug}>
                  <article
                    className={[
                      "group overflow-hidden rounded-2xl border border-stone-800/60 bg-[#0c0b09]/80 p-3 shadow-sm ring-1 ring-white/[0.04]",
                      "transition-[border-color,box-shadow] duration-300 ease-out",
                      "hover:border-stone-700/80 hover:shadow-md hover:shadow-black/20",
                    ].join(" ")}
                  >
                    {atCap ? (
                      <p className="mb-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-2.5 py-1.5 text-[11px] font-medium leading-snug text-amber-100/95">
                        Only {Number(item.stockCount)} left — max in cart.
                      </p>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-stone-700/50 bg-stone-950/50 ring-1 ring-white/[0.04] transition-transform duration-300 ease-out group-hover:scale-[1.02] sm:size-12">
                          {thumbOk ? (
                            <Image
                              src={item.image}
                              alt={item.name || "Product"}
                              fill
                              className="object-contain p-0.5"
                              sizes="48px"
                            />
                          ) : (
                            <NoImage
                              thumbnail
                              tone="zinc"
                              className="rounded-lg border-stone-700/50"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                            {item.category}
                          </p>
                          <h2 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-stone-100 sm:text-[0.95rem]">
                            {item.name}
                          </h2>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-800/60 pt-3 sm:flex-nowrap sm:border-0 sm:pt-0">
                        <div
                          className="inline-flex items-center rounded-xl border border-stone-700/50 bg-stone-950/40 p-0.5"
                          role="group"
                          aria-label={`Quantity for ${item.name}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.slug, item.quantity - 1)
                            }
                            className="rounded-lg p-1.5 text-stone-400 transition-all duration-200 hover:bg-white/10 hover:text-stone-100 active:scale-95"
                            aria-label={`Decrease ${item.name}`}
                          >
                            <Minus className="size-3.5 stroke-[2.25]" />
                          </button>
                          <span className="min-w-[2rem] select-none px-1 text-center text-xs font-semibold tabular-nums text-stone-200">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.slug, item.quantity + 1)
                            }
                            disabled={atCap}
                            className="rounded-lg p-1.5 text-stone-400 transition-all duration-200 hover:bg-white/10 hover:text-stone-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                            aria-label={`Increase ${item.name}`}
                          >
                            <Plus className="size-3.5 stroke-[2.25]" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="text-right">
                            <p className="text-sm font-semibold tabular-nums text-stone-100 sm:text-base">
                              {formatCurrency(lineTotal)}
                            </p>
                            {item.quantity > 1 ? (
                              <p className="text-[10px] tabular-nums text-stone-500">
                                {formatCurrency(item.price)} each
                              </p>
                            ) : null}
                            {hasCompare && compareLine ? (
                              <p className="text-[10px] tabular-nums text-stone-500 line-through">
                                {formatCurrency(compareLine)}
                              </p>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.slug)}
                            className="rounded-lg p-2 text-stone-500 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-300 active:scale-95"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>

          <aside className={`${storePanelClass} h-fit p-5 sm:p-6`}>
            <h2 className="font-heading text-lg font-semibold text-stone-100">
              Order summary
            </h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between text-stone-400">
                <span>Subtotal</span>
                <span className="tabular-nums text-stone-200">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Shipping</span>
                <span className="tabular-nums text-stone-200">
                  {formatCurrency(totals.shipping)}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Estimated tax</span>
                <span className="tabular-nums text-stone-200">
                  {formatCurrency(totals.tax)}
                </span>
              </div>
              <div className="border-t border-stone-800/70 pt-3">
                <div className="flex items-center justify-between text-base font-semibold text-stone-100">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className={`${authPrimaryButtonClass} mt-6`}
            >
              Continue to checkout <ArrowRight className="size-4" />
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
