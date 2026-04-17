import Link from "next/link";

const footerColumns = [
  {
    title: "Navigation",
    links: [
      { label: "Services", href: "/services" },
      { label: "Products", href: "/products" },
      { label: "Contact", href: "/contact" },
      { label: "Book Now", href: "/book-a-service" },
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
    <footer className="border-t border-white/[0.06] bg-[#070708]/90 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <span className="inline-flex items-center font-heading text-xl font-extrabold tracking-tight text-zinc-100 sm:text-2xl">
              <span className="tracking-tight leading-none">
                Studio <span className="text-rose-400">Salon</span>
              </span>
            </span>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-zinc-500">
              A calm space for hair, color, and care. Book online, visit the
              studio, and take home products we trust.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-rose-500">
                {col.title}
              </h4>
              <ul className="mt-6 space-y-4">
                {col.links.map((item) => (
                  <li key={`${col.title}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="text-xs font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-rose-500">
              Connect
            </h4>
            <div className="mt-6 flex gap-3">
              {["Web", "Share", "Email"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-rose-500 hover:text-white"
                  aria-label={label}
                >
                  <span className="text-sm font-black">{label.slice(0, 1)}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-rose-500/30 bg-rose-500/10 text-[10px] font-black text-rose-300">
                ⌁
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                OPEN TUE–SAT · BY APPOINTMENT
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 md:flex-row">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            © {new Date().getFullYear()} Studio Salon. CRAFTED WITH CARE.
          </span>
          <div className="flex gap-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-700">
              LICENSED STYLISTS
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-700">
              BOOK ONLINE 24/7
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

