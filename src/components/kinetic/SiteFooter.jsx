import Link from "next/link";
import { Calendar, Mail, ShoppingBag } from "lucide-react";

const footerColumns = [
  {
    title: "Explore",
    links: [
      { label: "Services", href: "/services" },
      { label: "Book", href: "/book-a-service" },
      { label: "Products", href: "/products" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Warranty", href: "/warranty" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-stone-800/60 bg-[#0a0908]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(244,114,182,0.06),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(253,230,138,0.03),transparent_45%)]" />

      <div className="relative mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="group inline-flex font-heading text-xl font-semibold tracking-tight text-stone-100 transition sm:text-2xl"
            >
              <span className="leading-none tracking-tight group-hover:text-stone-50">
                Studio{" "}
                <span className="text-amber-200/95 group-hover:text-amber-100">
                  Salon
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-stone-500">
              A calm space for hair, color, and care. Book online, visit the
              studio, and take home products we trust.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title} className="lg:col-span-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/75">
                {col.title}
              </h4>
              <ul className="mt-6 space-y-3.5">
                {col.links.map((item) => (
                  <li key={`${col.title}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-stone-400 transition-colors hover:text-amber-200/90"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/75">
              Quick links
            </h4>
            <ul className="mt-6 flex flex-col gap-3">
              <li>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-400 transition-colors hover:text-amber-200/90"
                >
                  <span className="flex size-9 items-center justify-center rounded-full border border-stone-700/60 bg-white/[0.04] text-amber-200/90 transition group-hover:border-stone-600">
                    <Mail className="size-4" aria-hidden />
                  </span>
                  Message us
                </Link>
              </li>
              <li>
                <Link
                  href="/book-a-service"
                  className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-400 transition-colors hover:text-amber-200/90"
                >
                  <span className="flex size-9 items-center justify-center rounded-full border border-stone-700/60 bg-white/[0.04] text-amber-200/90 transition group-hover:border-stone-600">
                    <Calendar className="size-4" aria-hidden />
                  </span>
                  Book a visit
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-400 transition-colors hover:text-amber-200/90"
                >
                  <span className="flex size-9 items-center justify-center rounded-full border border-stone-700/60 bg-white/[0.04] text-amber-200/90 transition group-hover:border-stone-600">
                    <ShoppingBag className="size-4" aria-hidden />
                  </span>
                  Shop retail
                </Link>
              </li>
            </ul>

            <div className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100/90"
                aria-hidden
              >
                ⌁
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                Open Tue–Sat · by appointment
              </span>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-stone-800/70 pt-10 sm:flex-row sm:gap-6">
          <span className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-stone-600 sm:text-left">
            © {new Date().getFullYear()} Studio Salon. All rights reserved.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-600">
            <span>Licensed stylists</span>
            <span className="hidden h-3 w-px bg-stone-700 sm:block" aria-hidden />
            <span>Book online 24/7</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
