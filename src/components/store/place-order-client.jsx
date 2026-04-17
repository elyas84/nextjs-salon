"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, ChevronLeft, Mail, MapPin, Phone, User } from "lucide-react";
import { LAST_ORDER_KEY, formatCurrency, safeParse } from "@/lib/store/cart";

function readInitialOrder() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(LAST_ORDER_KEY);
  return safeParse(stored, null);
}

export default function PlaceOrderClient() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams?.get("orderId");
  /** Receipt opened from dashboard/admin order link — not a fresh checkout confirmation */
  const isHistoryReceipt = Boolean(orderIdFromUrl);
  const [order, setOrder] = useState(null);
  /** Avoid flashing “No order” before `/api/orders/:id` responds */
  const [loading, setLoading] = useState(() => Boolean(orderIdFromUrl));
  const [sessionUser, setSessionUser] = useState(null);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      setSessionUser(res.ok ? data?.user ?? null : null);
    } catch {
      setSessionUser(null);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    let cancelled = false;
    const orderId = orderIdFromUrl;

    const hydrate = async () => {
      if (!orderId) {
        setLoading(false);
        setOrder(readInitialOrder());
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled) {
          setOrder(res.ok ? data.order : null);
        }
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
      return () => {
        cancelled = true;
      };
    }

    const timeoutId = window.setTimeout(hydrate, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchParams, orderIdFromUrl]);

  /**
   * Fill the main column height without `justify-center` (that can clip/paint badly
   * when the receipt grows past the viewport). Centering is done with `my-auto` on the panel.
   */
  const historyViewportClass =
    "flex min-h-[calc(100vh-160px)] w-full flex-col px-4 py-8 sm:px-6 lg:px-8";

  if (loading) {
    return (
      <section
        className={
          orderIdFromUrl
            ? historyViewportClass
            : "mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8"
        }
      >
        <div
          className={
            orderIdFromUrl
              ? "surface-panel mx-auto my-auto w-full max-w-md shrink-0 rounded-3xl p-8 text-center"
              : "surface-panel rounded-3xl p-8"
          }
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-rose-300">
            Receipt
          </p>
          <p className="mt-3 text-sm font-semibold text-zinc-50">Loading order…</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Please wait while we fetch your receipt.
          </p>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section
        className={
          orderIdFromUrl
            ? historyViewportClass
            : "mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8"
        }
      >
        <div
          className={
            orderIdFromUrl
              ? "surface-panel mx-auto my-auto w-full max-w-md shrink-0 rounded-3xl p-8 text-center"
              : "surface-panel rounded-3xl p-8"
          }
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-rose-300">
            Receipt
          </p>
          <p className="mt-3 text-sm font-semibold text-zinc-50">No order found</p>
          <h1 className="mt-2 text-2xl font-extrabold text-zinc-50 sm:text-3xl">
            We couldn’t find a recent order
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Complete checkout to generate your order confirmation.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors hover:bg-rose-500 hover:text-white"
          >
            Browse parts <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className={
        isHistoryReceipt
          ? historyViewportClass
          : "flex w-full justify-center px-4 py-8 sm:px-6 lg:px-8"
      }
    >
      <div
        className={`surface-panel mx-auto w-full max-w-4xl shrink-0 overflow-visible rounded-3xl p-6 ${
          isHistoryReceipt ? "my-auto" : ""
        }`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={sessionUser?.role === "admin" ? "/admin" : "/dashboard"}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-200 transition-colors hover:text-white"
            >
              <ChevronLeft className="size-4" />
              Back to {sessionUser?.role === "admin" ? "Admin" : "Dashboard"}
            </Link>

            {isHistoryReceipt && orderIdFromUrl ? (
              <p className="text-xs font-semibold text-zinc-400">
                Receipt for order{" "}
                <span className="font-mono text-zinc-200">
                  {String(orderIdFromUrl).slice(-8).toUpperCase()}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-rose-300">
                Order placed
              </p>
              <h1 className="mt-3 font-heading text-2xl font-extrabold tracking-tighter text-zinc-50 sm:mt-4 sm:text-3xl">
                Thank you for your purchase
              </h1>
            </div>
            <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 sm:self-center">
              <CheckCircle2 className="size-4" />
              Confirmed
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                Order number
              </p>
              <p className="mt-2 text-xl font-extrabold text-zinc-50">
                {order.orderNumber || order.id}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                Shipping details
              </p>
              <div className="mt-3 space-y-2 text-sm text-zinc-200">
                <p className="flex items-center gap-2">
                  <User className="size-4 text-zinc-500" aria-hidden />
                  <span className="min-w-0 truncate">
                    {order.shippingAddress?.fullName || "—"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-zinc-500" aria-hidden />
                  <span className="min-w-0 truncate">
                    {order.shippingAddress?.email || "—"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-zinc-500" aria-hidden />
                  <span className="min-w-0 truncate">
                    {order.shippingAddress?.phone || "—"}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
                  <span className="min-w-0">
                    {order.shippingAddress?.address || "—"}
                    {order.shippingAddress?.city ? `, ${order.shippingAddress.city}` : ""}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-zinc-500" aria-hidden />
                  <span className="min-w-0 truncate">
                    {order.shippingAddress?.postalCode || "—"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <aside className="h-fit min-h-0 w-full min-w-0 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-50">Receipt</h2>
            <div className="mt-4 space-y-3 text-sm">
              {order.items?.map((item, index) => (
                <div
                  key={`${item.slug ?? "item"}-${index}`}
                  className="flex items-start justify-between gap-3 sm:gap-4"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 object-cover"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-xl border border-white/10 bg-white/5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="wrap-break-word font-medium text-zinc-50">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 tabular-nums text-zinc-200">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.totals?.subtotal || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(order.totals?.shipping || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span>{formatCurrency(order.totals?.tax || 0)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-base font-semibold text-zinc-50">
                <span>Total</span>
                <span>{formatCurrency(order.totals?.total || 0)}</span>
              </div>
            </div>
          </aside>
        </div>

        {!isHistoryReceipt && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="kinetic-gradient inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors hover:brightness-110"
            >
              Continue shopping <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/cart"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 shadow-sm transition-colors hover:bg-white/10"
            >
              Back to cart
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
