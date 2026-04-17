"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { formatCurrency } from "@/lib/store/cart";

export default function CartPageClient() {
  const { items, updateQuantity, removeItem, totals } = useCart();

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-screen-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="surface-panel w-full rounded-3xl p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-orange-300">
            Cart
          </p>
          <h1 className="mt-3 text-2xl font-extrabold text-zinc-50 sm:text-3xl">
            Start with a product you like
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Add a phone, laptop, console, or accessory to begin checkout.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors hover:bg-orange-500 hover:text-white"
          >
            Browse products <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-orange-300">
          Cart
        </p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tighter text-zinc-50 sm:text-4xl">
          BUILD SUMMARY
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Review your items and continue to checkout.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_0.95fr] lg:gap-8">
        <ul className="flex flex-col gap-2.5">
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

            return (
              <li key={item.slug}>
                <article
                  className={[
                    "group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 shadow-sm backdrop-blur-sm",
                    "transition-[border-color,box-shadow,background-color] duration-300 ease-out",
                    "hover:border-white/[0.14] hover:bg-white/[0.045] hover:shadow-md hover:shadow-black/20",
                  ].join(" ")}
                >
                  {atCap ? (
                    <p className="mb-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-2.5 py-1.5 text-[11px] font-medium leading-snug text-amber-100/95">
                      Only {Number(item.stockCount)} left — max in cart.
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-white/[0.06] bg-zinc-950/80 ring-1 ring-white/[0.04] transition-transform duration-300 ease-out group-hover:scale-[1.02] sm:size-12">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name || "Product"}
                            fill
                            className="object-contain p-0.5"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase tracking-wide text-zinc-600">
                            —
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                          {item.category}
                        </p>
                        <h2 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 sm:text-[0.95rem]">
                          {item.name}
                        </h2>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3 sm:flex-nowrap sm:border-0 sm:pt-0">
                      <div
                        className="inline-flex items-center rounded-xl border border-white/[0.08] bg-zinc-950/40 p-0.5"
                        role="group"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.slug, item.quantity - 1)
                          }
                          className="rounded-lg p-1.5 text-zinc-400 transition-all duration-200 hover:bg-white/10 hover:text-zinc-100 active:scale-95"
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus className="size-3.5 stroke-[2.25]" />
                        </button>
                        <span className="min-w-[2rem] select-none px-1 text-center text-xs font-semibold tabular-nums text-zinc-200">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.slug, item.quantity + 1)
                          }
                          disabled={atCap}
                          className="rounded-lg p-1.5 text-zinc-400 transition-all duration-200 hover:bg-white/10 hover:text-zinc-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                          aria-label={`Increase ${item.name}`}
                        >
                          <Plus className="size-3.5 stroke-[2.25]" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums text-zinc-50 sm:text-base">
                            {formatCurrency(lineTotal)}
                          </p>
                          {item.quantity > 1 ? (
                            <p className="text-[10px] tabular-nums text-zinc-500">
                              {formatCurrency(item.price)} each
                            </p>
                          ) : null}
                          {hasCompare && compareLine ? (
                            <p className="text-[10px] tabular-nums text-zinc-500 line-through">
                              {formatCurrency(compareLine)}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.slug)}
                          className="rounded-lg p-2 text-zinc-500 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-300 active:scale-95"
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

        <aside className="surface-panel h-fit rounded-2xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Order summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between text-zinc-300">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Shipping</span>
              <span>{formatCurrency(totals.shipping)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Estimated tax</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-base font-semibold text-zinc-50">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          <Link
            href="/checkout"
            className="kinetic-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors hover:brightness-110"
          >
            Continue to checkout <ArrowRight className="size-4" />
          </Link>
        </aside>
      </div>
    </section>
  );
}
