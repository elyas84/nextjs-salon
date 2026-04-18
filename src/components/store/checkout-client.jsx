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
import {
  authInputClass,
  authPrimaryButtonClass,
  storePanelClass,
  storeSecondaryButtonClass,
} from "@/lib/auth-page-styles";

const steps = [
  { id: "shipping", label: "Shipping" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
];

const STEP_HEADINGS = [
  {
    title: "Shipping address",
    description: "Where should we send your order?",
  },
  {
    title: "Delivery",
    description: "Choose speed — pricing updates in your summary.",
  },
  {
    title: "Payment",
    description: "Card via Stripe or PayPal — demo checkout.",
  },
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
    ? "group flex w-full min-w-0 flex-col items-stretch gap-2 rounded-xl border border-stone-700/50 bg-white/[0.04] px-2.5 py-2 text-left transition hover:bg-white/[0.06]"
    : "group flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-stone-700/50 bg-white/[0.04] px-3 py-2 text-left transition hover:bg-white/[0.06]";

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
          <span className="inline-flex size-4 shrink-0 items-center justify-center text-stone-400">
            {icon}
          </span>
        ) : compact ? null : (
          <span className="inline-flex size-4 shrink-0 items-center justify-center">
            <span className="size-2 rounded-full bg-stone-500" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            {label}
          </span>
          <span
            className={[
              "mt-0.5 block min-w-0 text-stone-200",
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
        <span className="w-full rounded-lg border border-stone-700/50 bg-stone-950/40 px-2 py-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-400 transition group-hover:text-stone-200">
          Copy
        </span>
      ) : (
        <span className="shrink-0 rounded-lg border border-stone-700/50 bg-stone-950/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 transition group-hover:text-stone-200">
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
      <div className="relative border-b border-stone-800/50 bg-[#0a0908]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(244,114,182,0.06),transparent_55%)]" />
        <section className="relative mx-auto flex min-h-[55vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className={`${storePanelClass} w-full max-w-lg p-8 sm:p-10`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
              Checkout
            </p>
            <h1 className="mt-4 font-heading text-2xl font-semibold text-stone-100 sm:text-3xl">
              Your cart is empty
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Add products before continuing to shipping, delivery, and payment.
            </p>
            <button
              type="button"
              onClick={() => router.push("/products")}
              className={`${authPrimaryButtonClass} mt-8 w-full sm:w-auto`}
            >
              Shop products <ArrowRight className="size-4" />
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative border-b border-stone-800/50 bg-[#0a0908]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_-10%,rgba(253,230,138,0.06),transparent_55%)]" />
      <section className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
            Checkout
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-stone-100 sm:text-4xl">
            Shipping, delivery & payment
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500 sm:text-base">
            {isAuthenticated
              ? "You’re signed in — your order will appear on your dashboard."
              : "Guest checkout works too; sign in later to see history in one place."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.95fr]">
          <div className={`${storePanelClass} p-5 sm:p-8`}>
            <nav aria-label="Checkout steps" className="mb-8">
              <ol className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-3">
                {steps.map((item, index) => {
                  const active = index === step;
                  const complete = index < step;

                  return (
                    <li key={item.id} className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(index)}
                        className={`flex w-full min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                          active
                            ? "border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/20"
                            : complete
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-stone-800/60 bg-white/[0.02] hover:border-stone-600/80"
                        }`}
                      >
                        {complete ? (
                          <CheckCircle2 className="size-5 shrink-0 text-emerald-300/90" />
                        ) : (
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              active
                                ? "bg-amber-500/20 text-amber-100"
                                : "border border-stone-600 text-stone-500"
                            }`}
                          >
                            {index + 1}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                            Step {index + 1}
                          </span>
                          <span className="mt-0.5 block font-medium text-stone-100">
                            {item.label}
                          </span>
                        </span>
                      </button>
                      {index < steps.length - 1 ? (
                        <span
                          className="mx-1 hidden h-8 w-px shrink-0 bg-stone-700/80 md:block"
                          aria-hidden
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div className="border-t border-stone-800/60 pt-8">
              <div className="mb-6">
                <h2 className="font-heading text-lg font-semibold text-stone-100 sm:text-xl">
                  {STEP_HEADINGS[step].title}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {STEP_HEADINGS[step].description}
                </p>
              </div>

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
                    <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                      {field.label}
                    </span>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      className={authInputClass}
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
                        ? "border-amber-500/35 bg-amber-500/10 ring-1 ring-amber-500/15"
                        : "border-stone-800/60 bg-white/[0.03] hover:border-stone-700/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={option.id}
                      checked={formData.delivery === option.id}
                      onChange={handleChange}
                      className="mt-1 border-stone-600 text-amber-600 focus:ring-amber-500/30"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-stone-100">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-sm text-stone-500">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-stone-800/60 bg-white/[0.03] p-5 ring-1 ring-white/[0.04]">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                      Payment method
                    </p>
                    <p className="text-sm text-stone-500">
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
                              ? "border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/20"
                              : "border-stone-800/60 bg-stone-950/30 hover:border-stone-700/80",
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
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700/50 bg-stone-950/50">
                              {opt.id === "stripe" ? (
                                <StripeMark className="h-7 w-7" />
                              ) : (
                                <PayPalMark className="h-7 w-7" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-stone-100">
                                  {opt.label}
                                </p>
                                <span className="rounded-full border border-stone-700/50 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                                  {opt.helper}
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-5 text-stone-500">
                                {opt.description}
                              </p>
                            </div>
                          </div>
                          {active ? (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400/70 via-amber-500/50 to-transparent" />
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <section className="rounded-2xl border border-stone-800/60 bg-white/[0.03] p-5 ring-1 ring-white/[0.04]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-100">
                        Demo payment details
                      </p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        Optional — only needed if you want to log in to PayPal’s
                        sandbox or use the demo card values.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDemoDetails((current) => !current)}
                      className="rounded-full border border-stone-600/80 bg-transparent px-3.5 py-2 text-xs font-semibold text-stone-200 transition hover:border-stone-500 hover:bg-white/[0.04]"
                    >
                      {showDemoDetails ? "Hide" : "Show"}
                    </button>
                  </div>

                  {showDemoDetails ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-stone-800/60 bg-stone-950/40 p-4 overflow-hidden">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-700/50 bg-stone-950/50">
                            <StripeMark className="h-6 w-6" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-stone-100">
                              Stripe (test card)
                            </p>
                            <p className="text-[11px] text-stone-500">
                              Use these in Stripe checkout.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2">
                          <CopyRow
                            label="Card number"
                            value={DEMO_PAYMENT_DETAILS.stripe.cardNumber}
                            icon={<CreditCard className="size-4 text-stone-400" />}
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

                      <div className="rounded-2xl border border-stone-800/60 bg-stone-950/40 p-4 overflow-hidden">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-700/50 bg-stone-950/50">
                            <PayPalMark className="h-6 w-6" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-stone-100">
                              PayPal (sandbox)
                            </p>
                            <p className="text-[11px] text-stone-500">
                              Login for the PayPal demo flow.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2 min-w-0">
                          <CopyRow
                            label="Email"
                            value={DEMO_PAYMENT_DETAILS.paypal.buyerEmail}
                            icon={<CreditCard className="size-4 text-stone-400" />}
                          />
                          <CopyRow
                            label="Password"
                            value={DEMO_PAYMENT_DETAILS.paypal.password}
                            icon={<KeyRound className="size-4 text-stone-400" />}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </section>

                {formData.paymentMethod === "stripe" ? (
                  <div className="rounded-2xl border border-stone-800/60 bg-white/[0.03] p-5 ring-1 ring-white/[0.04]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700/50 bg-stone-950/50">
                          <StripeMark className="h-7 w-7" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-stone-100">
                            Pay with Stripe
                          </p>
                          <p className="mt-1 text-xs leading-5 text-stone-500">
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
                      className={`${authPrimaryButtonClass} mt-4 w-full sm:w-auto`}
                    >
                      {isSubmitting ? "Starting checkout..." : "Continue to Stripe"}
                      {!isSubmitting ? <ArrowRight className="size-4" /> : null}
                    </button>
                  </div>
                ) : null}

                {formData.paymentMethod === "paypal" ? (
                  <div className="rounded-2xl border border-stone-800/60 bg-white/[0.03] p-5 ring-1 ring-white/[0.04]">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700/50 bg-stone-950/50">
                        <PayPalMark className="h-7 w-7" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-stone-100">
                          Pay with PayPal
                        </p>
                        <p className="mt-1 text-xs leading-5 text-stone-500">
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
                      <div className="mt-4 rounded-2xl border border-dashed border-stone-700/50 bg-stone-950/30 p-4 text-sm text-stone-400">
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
              className={`${storeSecondaryButtonClass} disabled:opacity-40`}
            >
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className={`${authPrimaryButtonClass} w-auto`}
              >
                Continue <ArrowRight className="size-4" />
              </button>
            ) : (
              <span className="rounded-2xl border border-stone-800/60 bg-white/[0.03] px-4 py-3 text-sm text-stone-500">
                Choose a payment method above to finish
              </span>
            )}
          </div>
        </div>

        <aside className={`${storePanelClass} h-fit p-5 sm:p-6`}>
          <h2 className="font-heading text-lg font-semibold text-stone-100">
            Order summary
          </h2>
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div key={item.slug} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-stone-100">{item.name}</p>
                  <p className="text-xs text-stone-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm tabular-nums text-stone-300">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-stone-800/70 pt-4 text-sm">
            <div className="flex items-center justify-between text-stone-400">
              <span>Subtotal</span>
              <span className="tabular-nums text-stone-200">
                {formatCurrency(checkoutTotals.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-400">
              <span>Shipping</span>
              <span className="tabular-nums text-stone-200">
                {formatCurrency(checkoutTotals.shipping)}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-400">
              <span>Estimated tax (8%)</span>
              <span className="tabular-nums text-stone-200">
                {formatCurrency(checkoutTotals.tax)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 text-base font-semibold text-stone-100">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCurrency(checkoutTotals.total)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
    </div>
  );
}
