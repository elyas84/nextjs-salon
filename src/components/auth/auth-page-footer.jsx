import Link from "next/link";

/**
 * Slim fixed strip for full-bleed auth pages (login / register / reset).
 * @param {{ links?: Array<{ label: string, href: string }> }} props
 */
export default function AuthPageFooter({
  links = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
  ],
}) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-stone-800/60 bg-[#0a0908]/90 px-4 py-4 backdrop-blur-md sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-600 sm:flex-row">
        <span>© {new Date().getFullYear()} Studio Salon</span>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-amber-200/90"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
