"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/components/store/cart-provider";
import {
  LAST_ORDER_KEY,
  PENDING_CHECKOUT_KEY,
  safeParse,
} from "@/lib/store/cart";

export default function CheckoutSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Confirming your payment...");
  const processingRef = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const lockKey = sessionId ? `voltmart:stripe-success:${sessionId}` : "";

    if (!sessionId) {
      setStatus("error");
      setMessage("We could not resume the checkout. Please go back and try again.");
      return;
    }

    if (processingRef.current) {
      return;
    }

        if (lockKey && window.sessionStorage.getItem(lockKey) === "done") {
          setStatus("success");
          setMessage("Payment already confirmed. Redirecting to your receipt...");
          router.replace("/place-order");
      return;
    }

    if (lockKey && window.sessionStorage.getItem(lockKey) === "processing") {
      return;
    }

    if (lockKey) {
      window.sessionStorage.setItem(lockKey, "processing");
    }
    processingRef.current = true;

    const run = async () => {
      const pending = safeParse(
        window.localStorage.getItem(PENDING_CHECKOUT_KEY),
        null,
      );

      if (!sessionId || !pending) {
        setStatus("error");
        setMessage("We could not resume the checkout. Please go back and try again.");
        return;
      }

      try {
        const res = await fetch(
          `/api/payments/stripe/session?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = await res.json();

        if (!res.ok || data.payment_status !== "paid") {
          throw new Error(
            data.error || "Stripe payment was not confirmed as paid.",
          );
        }

        const orderPayload = {
          ...pending,
          paymentMethod: "stripe",
          paymentProvider: "stripe",
          paymentStatus: "paid",
          paymentReference: data.id,
        };

        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(orderPayload),
        });
        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          throw new Error(orderData.error || "Failed to create the order.");
        }

        window.localStorage.setItem(
          LAST_ORDER_KEY,
          JSON.stringify(orderData.order || orderPayload),
        );
        window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
        if (lockKey) {
          window.sessionStorage.setItem(lockKey, "done");
        }
        clearCart();
        setStatus("success");
        setMessage("Payment confirmed. Redirecting to your receipt...");
        toast.success("Stripe payment confirmed.");
        window.setTimeout(() => {
          router.replace("/place-order");
        }, 900);
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Something went wrong confirming payment.");
        toast.error(error.message || "Stripe payment confirmation failed.");
        if (lockKey) {
          window.sessionStorage.removeItem(lockKey);
        }
        processingRef.current = false;
      }
    };

    run();
  }, [clearCart, router, searchParams]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-4 py-16">
      <section className="surface-panel w-full rounded-4xl p-6 text-center sm:p-8">
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full border shadow-sm ${
            status === "success"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              : status === "error"
                ? "border-rose-500/25 bg-rose-500/10 text-rose-200"
                : "border-white/10 bg-white/5 text-zinc-200"
          }`}
        >
          {status === "loading" ? (
            <Loader2 className="size-7 animate-spin text-zinc-200" />
          ) : status === "success" ? (
            <CheckCircle2 className="size-7" />
          ) : (
            <XCircle className="size-7" />
          )}
        </div>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.3em] text-rose-300">
          Checkout
        </p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tighter text-zinc-50">
          {status === "success" ? "Payment successful" : "Stripe checkout"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{message}</p>

        {status === "error" ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/checkout"
              className="kinetic-gradient inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors hover:brightness-110"
            >
              Back to checkout <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
