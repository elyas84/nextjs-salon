"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, CreditCard, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCart } from "@/components/store/cart-provider";
import {
  buildOrderNumber,
  calculateCartTotals,
  formatCurrency,
  safeParse,
  LAST_ORDER_KEY,
  PENDING_CHECKOUT_KEY,
} from "@/lib/store/cart";

const steps = [
  { id: "shipping", label: "Shipping" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
];

const DEMO_PAYMENT_DETAILS = {
  stripe: {
    cardNumber: "4242 4242 4242 4242",
    expiry: "12/34",
    cvc: "123",
    zip: "10001",
  },
  paypal: {
    buyerEmail: "sb-hyjcl32473590@personal.example.com",
    password: "j6!#-JswyGwG9eS",
  },
};

const CHECKOUT_DRAFT_KEY = "voltmart:checkout-draft";

function StripeMark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Stripe"
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#635BFF" />
      <path
        fill="white"
        d="M39.7 27.2c0-1.9-1.6-2.8-4.3-2.8-1.9 0-3.2.3-4.8 1v-4.4c1.7-.6 3.6-.9 5.8-.9 5.1 0 8.6 2.5 8.6 7.1 0 7.2-10.1 6-10.1 9.1 0 .9.8 1.3 2.4 1.3 2 0 3.9-.4 5.7-1.3v4.5c-1.8.7-4.1 1-6.6 1-5 0-8.4-2.4-8.4-6.8 0-7.6 10.1-6.2 10.1-9.1Z"
      />
    </svg>
  );
}

function PayPalMark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="PayPal"
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#0B5FFF" />
      <path
        fill="#FFFFFF"
        d="M24.7 44.5h-4l3.7-24.8h10.4c6 0 9.3 3.1 8.4 9.1-.9 6.2-5.3 9.1-11.6 9.1h-3.5l-1.4 6.6Zm4.2-10.6h2.9c3.2 0 5.1-1.2 5.6-4.6.4-2.8-.9-4-3.8-4h-3.2l-1.5 8.6Z"
        opacity=".95"
      />
      <path
        fill="#9AD0FF"
        d="M41.8 23.3c.3.9.4 2 .2 3.2-.9 6.2-5.3 9.1-11.6 9.1h-1.9l-1.4 6.6h-3.2l.1-.7 1.3-5.9 1.4-6.6h3.5c6.3 0 10.7-2.9 11.6-9.1Z"
      />
    </svg>
  );
}

async function copyToClipboard(text) {
  const value = String(text ?? "");
  if (!value) return false;
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // ignore and fallback
  }
  try {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "true");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    el.style.top = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function CopyRow({ label, value, icon = null, compact = false }) {
  const onCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) toast.success("Copied");
    else toast.error("Copy failed");
  };

  const wrapClassName = compact
    ? "group flex w-full min-w-0 flex-col items-stretch gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-left transition hover:bg-white/10"
    : "group flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={onCopy}
      className={wrapClassName}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      <span className={compact ? "flex min-w-0 items-start gap-2" : "flex min-w-0 items-center gap-2"}>
        {icon ? (
          <span className="inline-flex size-4 shrink-0 items-center justify-center text-zinc-300">
            {icon}
          </span>
        ) : compact ? null : (
          <span className="inline-flex size-4 shrink-0 items-center justify-center">
            <span className="size-2 rounded-full bg-zinc-300" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {label}
          </span>
          <span
            className={[
              "mt-0.5 block min-w-0 text-zinc-200",
              compact
                ? "text-sm font-semibold leading-tight whitespace-nowrap"
                : "truncate text-xs",
            ].join(" ")}
          >
            {value}
          </span>
        </span>
      </span>
      {compact ? (
        <span className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-widest text-zinc-300 transition group-hover:text-zinc-100">
          Copy
        </span>
      ) : (
        <span className="shrink-0 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition group-hover:text-zinc-100">
          Copy
        </span>
      )}
    </button>
  );
}

export default function CheckoutClient({ paypalClientId = "" }) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    delivery: "standard",
    paymentMethod: "stripe",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDemoDetails, setShowDemoDetails] = useState(false);

  const orderReady = items.length > 0;
  const checkoutTotals = calculateCartTotals(items, formData.delivery);
  const paypalOptions = paypalClientId
    ? {
        clientId: paypalClientId,
        currency: "USD",
        intent: "capture",
        components: "buttons",
      }
    : null;
  const hasPaypalServerConfig = Boolean(paypalClientId);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!cancelled) {
          setIsAuthenticated(res.ok);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const draft = safeParse(window.localStorage.getItem(CHECKOUT_DRAFT_KEY), null);
    if (!draft || typeof draft !== "object") return;

    if (draft.formData && typeof draft.formData === "object") {
      setFormData((current) => ({
        ...current,
        ...draft.formData,
      }));
    }

    if (typeof draft.step === "number") {
      setStep(Math.min(Math.max(draft.step, 0), steps.length - 1));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      CHECKOUT_DRAFT_KEY,
      JSON.stringify({
        step,
        formData,
      }),
    );
  }, [formData, step]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const buildCheckoutPayload = ({
    paymentMethod,
    paymentProvider,
    paymentStatus,
    paymentReference,
  }) => ({
    id: buildOrderNumber(),
    createdAt: new Date().toISOString(),
    items,
    totals: checkoutTotals,
    shippingAddress: {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
    },
    delivery: formData.delivery,
    paymentMethod,
    paymentProvider,
    paymentStatus,
    paymentReference,
  });

  const storePendingCheckout = (payload) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        PENDING_CHECKOUT_KEY,
        JSON.stringify(payload),
      );
    }
  };

  const finalizeOrder = async (payload) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to place order.");
    }

    const savedOrder = data.order || payload;
    window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(savedOrder));
    window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
    window.localStorage.removeItem(CHECKOUT_DRAFT_KEY);
    clearCart();
    router.push("/place-order");
  };

  const nextStep = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const previousStep = () => setStep((current) => Math.max(current - 1, 0));

  const startStripeCheckout = async () => {
    if (!orderReady) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const checkoutPayload = buildCheckoutPayload({
        paymentMethod: "stripe",
        paymentProvider: "stripe",
        paymentStatus: "pending",
        paymentReference: "",
      });
      storePendingCheckout(checkoutPayload);

      const res = await fetch("/api/payments/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start Stripe checkout.");
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Stripe checkout session was not created.");
    } catch (error) {
      toast.error(error.message || "Failed to start Stripe checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const capturePayPalOrder = async (orderID) => {
    const res = await fetch("/api/payments/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderID }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to capture PayPal payment.");
    }

    return data.capture;
  };

  const finalizePayPalOrder = async ({ orderID, capture }) => {
    const checkoutPayload = buildCheckoutPayload({
      paymentMethod: "paypal",
      paymentProvider: "paypal",
      paymentStatus: "paid",
      paymentReference:
        capture?.id || capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderID,
    });

    await finalizeOrder(checkoutPayload);
  };

  if (!orderReady) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="surface-panel rounded-3xl p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-orange-300">
            Checkout
          </p>
          <h1 className="mt-3 text-2xl font-extrabold text-zinc-50 sm:text-3xl">
            Checkout starts with a cart
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Add items before continuing to checkout.
          </p>
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors hover:bg-orange-500 hover:text-white"
          >
            Shop products <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-orange-300">
          Checkout
        </p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tighter text-zinc-50 sm:text-4xl">
          FINALIZE ORDER
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {isAuthenticated
            ? "You are signed in, so your order can sync with your dashboard."
            : "You can still place an order, but signing in keeps the history in your dashboard."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.95fr]">
        <div className="surface-panel rounded-3xl p-6">
          <div className="flex flex-wrap gap-3">
            {steps.map((item, index) => {
              const active = index === step;
              const complete = index < step;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-orange-500 text-zinc-950"
                      : complete
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                        : "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                  }`}
                >
                  {complete ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <span className="inline-flex size-5 items-center justify-center rounded-full border border-current text-[11px]">
                      {index + 1}
                    </span>
                  )}
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            {step === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { name: "fullName", label: "Full name", type: "text" },
                  { name: "email", label: "Email", type: "email" },
                  { name: "phone", label: "Phone", type: "tel" },
                  { name: "address", label: "Address", type: "text" },
                  { name: "city", label: "City", type: "text" },
                  { name: "postalCode", label: "Postal code", type: "text" },
                ].map((field) => (
                  <label key={field.name} className="space-y-2 md:col-span-1">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                      {field.label}
                    </span>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 shadow-sm outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-orange-500/30"
                    />
                  </label>
                ))}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                {[
                  {
                    id: "standard",
                    label: "Standard shipping",
                    description: "Arrives in 3-5 business days.",
                  },
                  {
                    id: "express",
                    label: "Express shipping",
                    description: "Arrives in 1-2 business days.",
                  },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                      formData.delivery === option.id
                        ? "border-orange-500/40 bg-orange-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={option.id}
                      checked={formData.delivery === option.id}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-zinc-50">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-sm text-zinc-400">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-zinc-400">
                      Payment method
                    </p>
                    <p className="text-sm text-zinc-400">
                      Choose one option to complete the demo checkout.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        id: "stripe",
                        label: "Stripe",
                        helper: "Card",
                        description: "Redirects to the Stripe test checkout.",
                      },
                      {
                        id: "paypal",
                        label: "PayPal",
                        helper: "Wallet",
                        description: "Completes payment in-page with PayPal buttons.",
                      },
                    ].map((opt) => {
                      const active = formData.paymentMethod === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={[
                            "group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition",
                            active
                              ? "border-orange-500/50 bg-orange-500/10"
                              : "border-white/10 bg-black/20 hover:bg-white/5",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={opt.id}
                            checked={active}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/40">
                              {opt.id === "stripe" ? (
                                <StripeMark className="h-7 w-7" />
                              ) : (
                                <PayPalMark className="h-7 w-7" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-zinc-50">
                                  {opt.label}
                                </p>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                  {opt.helper}
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-5 text-zinc-400">
                                {opt.description}
                              </p>
                            </div>
                          </div>
                          {active ? (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-400/80 via-orange-500/60 to-transparent" />
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-50">
                        Demo payment details
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        Optional — only needed if you want to log in to PayPal’s
                        sandbox or use the demo card values.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDemoDetails((current) => !current)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-100 shadow-sm transition-colors hover:bg-white/10"
                    >
                      {showDemoDetails ? "Hide" : "Show"}
                    </button>
                  </div>

                  {showDemoDetails ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 overflow-hidden">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/40">
                            <StripeMark className="h-6 w-6" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-zinc-50">
                              Stripe (test card)
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              Use these in Stripe checkout.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2">
                          <CopyRow
                            label="Card number"
                            value={DEMO_PAYMENT_DETAILS.stripe.cardNumber}
                            icon={<CreditCard className="size-4 text-zinc-300" />}
                          />
                          <div className="grid gap-2 sm:grid-cols-3">
                            <CopyRow
                              label="Expiry"
                              value={DEMO_PAYMENT_DETAILS.stripe.expiry}
                              compact
                            />
                            <CopyRow
                              label="CVC"
                              value={DEMO_PAYMENT_DETAILS.stripe.cvc}
                              compact
                            />
                            <CopyRow
                              label="ZIP"
                              value={DEMO_PAYMENT_DETAILS.stripe.zip}
                              compact
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 overflow-hidden">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/40">
                            <PayPalMark className="h-6 w-6" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-zinc-50">
                              PayPal (sandbox)
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              Login for the PayPal demo flow.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2 min-w-0">
                          <CopyRow
                            label="Email"
                            value={DEMO_PAYMENT_DETAILS.paypal.buyerEmail}
                            icon={<CreditCard className="size-4 text-zinc-300" />}
                          />
                          <CopyRow
                            label="Password"
                            value={DEMO_PAYMENT_DETAILS.paypal.password}
                            icon={<KeyRound className="size-4 text-zinc-300" />}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </section>

                {formData.paymentMethod === "stripe" ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/40">
                          <StripeMark className="h-7 w-7" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-50">
                            Pay with Stripe
                          </p>
                          <p className="mt-1 text-xs leading-5 text-zinc-400">
                            You’ll be redirected to Stripe test checkout and
                            returned after confirmation.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startStripeCheckout}
                      disabled={isSubmitting}
                      className="kinetic-gradient mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {isSubmitting ? "Starting checkout..." : "Continue to Stripe"}
                      {!isSubmitting ? <ArrowRight className="size-4" /> : null}
                    </button>
                  </div>
                ) : null}

                {formData.paymentMethod === "paypal" ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/40">
                        <PayPalMark className="h-7 w-7" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-50">
                          Pay with PayPal
                        </p>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">
                          Complete the demo transaction using PayPal buttons below.
                        </p>
                      </div>
                    </div>

                    {paypalOptions ? (
                      <div className="mt-4">
                        <PayPalScriptProvider options={paypalOptions}>
                          <PayPalButtons
                            style={{ layout: "vertical", tagline: false }}
                            createOrder={async () => {
                              const res = await fetch(
                                "/api/payments/paypal/create-order",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify(
                                    buildCheckoutPayload({
                                      paymentMethod: "paypal",
                                      paymentProvider: "paypal",
                                      paymentStatus: "pending",
                                      paymentReference: "",
                                    }),
                                  ),
                                },
                              );
                              const data = await res.json();

                              if (!res.ok) {
                                throw new Error(
                                  data.error || "Failed to create PayPal order.",
                                );
                              }

                              return data.orderID;
                            }}
                            onApprove={async (data) => {
                              setIsSubmitting(true);
                              try {
                                const capture = await capturePayPalOrder(
                                  data.orderID,
                                );
                                await finalizePayPalOrder({
                                  orderID: data.orderID,
                                  capture,
                                });
                              } catch (error) {
                                toast.error(
                                  error.message ||
                                    "Failed to complete PayPal payment.",
                                );
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            onCancel={() => {
                              toast("PayPal checkout was cancelled.");
                            }}
                            onError={(error) => {
                              console.error("PayPal checkout error:", error);
                              toast.error("PayPal checkout failed.");
                            }}
                            disabled={isSubmitting}
                          />
                        </PayPalScriptProvider>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-zinc-300">
                        Add `PAYPAL_CLIENT_ID` to enable PayPal buttons.
                      </div>
                    )}
                    {!hasPaypalServerConfig ? (
                      <p className="mt-3 text-xs leading-6 text-amber-200/90">
                        PayPal is unavailable until the server environment is
                        restarted with the payment credentials loaded.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={previousStep}
              disabled={step === 0}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 shadow-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="kinetic-gradient inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors hover:brightness-110"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            ) : (
              <span className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 shadow-sm">
                Choose a payment method above to finish the demo transaction
              </span>
            )}
          </div>
        </div>

        <aside className="surface-panel h-fit rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Summary</h2>
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div key={item.slug} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-50">{item.name}</p>
                  <p className="text-xs text-zinc-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm text-zinc-300">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-sm">
            <div className="flex items-center justify-between text-zinc-300">
              <span>Subtotal</span>
              <span>{formatCurrency(checkoutTotals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Shipping</span>
              <span>{formatCurrency(checkoutTotals.shipping)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Estimated tax (8%)</span>
              <span>{formatCurrency(checkoutTotals.tax)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 text-base font-semibold text-zinc-50">
              <span>Total</span>
              <span>{formatCurrency(checkoutTotals.total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
