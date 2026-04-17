import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-stone-500 sm:mb-6 sm:text-sm"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div
            key={`${item.label}-${index}`}
            className="flex min-w-0 items-center gap-2"
          >
            {index > 0 ? (
              <ChevronRight
                className="size-3.5 shrink-0 text-stone-600 sm:size-4"
                aria-hidden
              />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="max-w-[40vw] truncate font-medium text-stone-400 transition-colors hover:text-amber-200/95 sm:max-w-none"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={[
                  "min-w-0 max-w-full truncate",
                  isLast
                    ? "font-semibold text-stone-100 sm:font-medium"
                    : "text-stone-400",
                ].join(" ")}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
