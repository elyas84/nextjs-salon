"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import NoImage from "@/components/ui/NoImage";
import { isUsableImageUrl } from "@/lib/site-hero";
import {
  authPrimaryButtonClass,
  storePanelClass,
  storeSecondaryButtonClass,
} from "@/lib/auth-page-styles";
import { LAST_ORDER_KEY, formatCurrency, safeParse } from "@/lib/store/cart";

function readInitialOrder() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(LAST_ORDER_KEY);
  return safeParse(stored, null);
}

const shellClass =
  "relative border-b border-stone-800/50 bg-[#0a0908]";

const innerCardClass =
  "rounded-2xl border border-stone-800/60 bg-white/[0.03] p-5 ring-1 ring-white/[0.04]";

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

  const isAdmin =
    sessionUser?.role === "superadmin" || sessionUser?.role === "admin";

  if (loading) {
    return (
      <div className={shellClass}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(244,114,182,0.06),transparent_55%)]" />
        <section
          className={
            orderIdFromUrl
              ? `relative ${historyViewportClass}`
              : "relative mx-auto flex min-h-[55vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8"
          }
        >
          <div
            className={
              orderIdFromUrl
                ? `${storePanelClass} mx-auto my-auto w-full max-w-md shrink-0 p-8 text-center`
                : `${storePanelClass} max-w-lg p-8 sm:p-10`
            }
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
              Receipt
            </p>
            <p className="mt-4 text-sm font-semibold text-stone-100">
              Loading order…
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
              Please wait while we fetch your receipt.
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={shellClass}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(244,114,182,0.06),transparent_55%)]" />
        <section
          className={
            orderIdFromUrl
              ? `relative ${historyViewportClass}`
              : "relative mx-auto flex min-h-[55vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8"
          }
        >
          <div
            className={
              orderIdFromUrl
                ? `${storePanelClass} mx-auto my-auto w-full max-w-md shrink-0 p-8 text-center`
                : `${storePanelClass} w-full max-w-lg p-8 sm:p-10`
            }
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
              Receipt
            </p>
            <p className="mt-4 text-sm font-semibold text-stone-100">
              No order found
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-stone-100 sm:text-3xl">
              We couldn’t find a recent order
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Complete checkout to see your confirmation here.
            </p>
            <Link
              href="/products"
              className={`${authPrimaryButtonClass} mt-8 inline-flex w-full sm:w-auto`}
            >
              Browse products <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_-10%,rgba(253,230,138,0.06),transparent_55%)]" />
      <section
        className={
          isHistoryReceipt
            ? `relative ${historyViewportClass}`
            : "relative flex w-full justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
        }
      >
        <div
          className={`${storePanelClass} mx-auto w-full max-w-4xl shrink-0 overflow-visible p-6 sm:p-8 ${
            isHistoryReceipt ? "my-auto" : ""
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={isAdmin ? "/admin" : "/dashboard"}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-400 transition-colors hover:text-amber-200/90"
              >
                <ChevronLeft className="size-4" />
                Back to {isAdmin ? "Admin" : "Dashboard"}
              </Link>

              {isHistoryReceipt && orderIdFromUrl ? (
                <p className="text-xs font-medium text-stone-500">
                  Receipt for order{" "}
                  <span className="font-mono text-stone-300">
                    {String(orderIdFromUrl).slice(-8).toUpperCase()}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                  Order placed
                </p>
                <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-stone-100 sm:mt-4 sm:text-3xl">
                  Thank you for your purchase
                </h1>
              </div>
              <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200/95 sm:self-center">
                <CheckCircle2 className="size-4" />
                Confirmed
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="min-w-0 space-y-5">
              <div className={innerCardClass}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                  Order number
                </p>
                <p className="mt-2 font-heading text-xl font-semibold text-stone-100">
                  {order.orderNumber || order.id}
                </p>
              </div>

              <div className={innerCardClass}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                  Shipping details
                </p>
                <div className="mt-3 space-y-2 text-sm text-stone-300">
                  <p className="flex items-center gap-2">
                    <User className="size-4 shrink-0 text-stone-500" aria-hidden />
                    <span className="min-w-0 truncate">
                      {order.shippingAddress?.fullName || "—"}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-stone-500" aria-hidden />
                    <span className="min-w-0 truncate">
                      {order.shippingAddress?.email || "—"}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-stone-500" aria-hidden />
                    <span className="min-w-0 truncate">
                      {order.shippingAddress?.phone || "—"}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-stone-500"
                      aria-hidden
                    />
                    <span className="min-w-0">
                      {order.shippingAddress?.address || "—"}
                      {order.shippingAddress?.city
                        ? `, ${order.shippingAddress.city}`
                        : ""}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-stone-500" aria-hidden />
                    <span className="min-w-0 truncate">
                      {order.shippingAddress?.postalCode || "—"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <aside
              className={`h-fit min-h-0 w-full min-w-0 ${innerCardClass} bg-[#0c0b09]/95`}
            >
              <h2 className="font-heading text-lg font-semibold text-stone-100">
                Receipt
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                {order.items?.map((item, index) => (
                  <div
                    key={`${item.slug ?? "item"}-${index}`}
                    className="flex items-start justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {item.image &&
                      isUsableImageUrl(String(item.image).trim()) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-xl border border-stone-700/50 bg-stone-950/50 object-cover"
                        />
                      ) : (
                        <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-stone-700/50">
                          <NoImage
                            thumbnail
                            tone="zinc"
                            className="rounded-xl border-stone-700/50"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="wrap-break-word font-medium text-stone-100">
                          {item.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 tabular-nums text-stone-200">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-stone-800/70 pt-4 text-sm text-stone-400">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-stone-200">
                    {formatCurrency(order.totals?.subtotal || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="tabular-nums text-stone-200">
                    {formatCurrency(order.totals?.shipping || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span className="tabular-nums text-stone-200">
                    {formatCurrency(order.totals?.tax || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-base font-semibold text-stone-100">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.totals?.total || 0)}
                  </span>
                </div>
              </div>
            </aside>
          </div>

          {!isHistoryReceipt && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className={`${authPrimaryButtonClass} w-full sm:w-auto`}
              >
                Continue shopping <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/cart"
                className={`${storeSecondaryButtonClass} w-full sm:w-auto`}
              >
                View cart
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
