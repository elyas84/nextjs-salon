"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Mail, ShieldCheck, Store, Truck, X } from "lucide-react";

const baseFooterColumns = [
  {
    title: "Help & information",
    links: [
      { href: "/contact", label: "Customer service" },
      { href: "/cart", label: "Cart" },
      { href: "/checkout", label: "Checkout" },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/products?category=Mobile", label: "Mobile" },
      { href: "/products?category=PC", label: "PC" },
      { href: "/products?category=Gaming%20Console", label: "Gaming consoles" },
      { href: "/products", label: "All products" },
    ],
  },
];

const socialLinks = [
  {
    href: "https://instagram.com",
    label: "Instagram",
    icon: InstagramIcon,
  },
  { href: "https://facebook.com", label: "Facebook", icon: FacebookIcon },
  { href: "https://threads.net", label: "Threads", icon: ThreadsIcon },
  { href: "https://x.com", label: "X", icon: X },
];

function InstagramIcon({ className = "size-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className = "size-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 8.5V7.25c0-.95.42-1.75 1.75-1.75H18V2h-2.5C12.57 2 11 3.67 11 6.5V8.5H8v3h3V22h3v-10.5h2.75l.5-3H14Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ThreadsIcon({ className = "size-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12.2 7.2c2.8 0 4.4 1.2 5.2 3.1l-2 .7c-.4-1-1.3-1.7-3.2-1.7-1.6 0-2.7.5-2.7 1.4 0 .9.9 1.2 2.3 1.4l1.8.2c3 .4 4.7 1.6 4.7 4 0 2.7-2.3 4.4-6.1 4.4-3 0-5.1-1.1-6.2-3.2l2-.8c.7 1.3 2 2 4.2 2 2 0 3.1-.7 3.1-1.8 0-1-.8-1.4-2.5-1.6l-1.8-.2c-2.9-.3-4.5-1.5-4.5-3.7 0-2.3 2-3.8 5.7-3.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function SiteFooter() {
  const [sessionUser, setSessionUser] = useState(null);

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
      }
    } catch {
      if (!cancelledRef?.current) {
        setSessionUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const cancelledRef = { current: false };
    const handleAuthChanged = () => loadSession(cancelledRef);

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

  const aboutLinks = useMemo(() => {
    const links = [{ href: "/about", label: "About eCom" }];

    if (sessionUser?.role === "superadmin") {
      links.push({ href: "/admin", label: "Admin" });
      return links;
    }

    if (sessionUser?.role === "client") {
      links.push({ href: "/dashboard", label: "My account" });
      return links;
    }

    links.push({ href: "/login", label: "Sign in" });
    return links;
  }, [sessionUser?.role]);

  const footerColumns = useMemo(
    () => [...baseFooterColumns, { title: "About", links: aboutLinks }],
    [aboutLinks],
  );

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
                <Store className="size-5" />
              </span>
              <p className="brand-mark text-xl font-bold text-slate-900">eCom</p>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Electronics marketplace experience for phones, PCs, consoles, and
              accessories. Built to keep browsing, cart management, and checkout
              straightforward.
            </p>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <div className="inline-flex items-center gap-2">
                <Truck className="size-4 text-slate-700" /> Fast delivery
              </div>
              <div className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-slate-700" /> Secure checkout
              </div>
              <div className="inline-flex items-center gap-2">
                <CreditCard className="size-4 text-slate-700" /> Multiple payments
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-semibold text-slate-900">
                  {column.title}
                </p>
                <div className="mt-3 grid gap-2 text-sm">
                  {column.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-slate-600 transition-colors hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <link.icon className="size-4" />
                </Link>
              ))}
            </div>

            <div className="flex w-full max-w-md gap-2">
              <label className="sr-only" htmlFor="footer-email">
                Email address
              </label>
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Mail className="size-4 shrink-0 text-slate-700" />
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Get offers by email"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} eCom. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
