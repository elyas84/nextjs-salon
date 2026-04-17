import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold text-slate-500 sm:mb-6 sm:text-sm sm:font-normal sm:text-slate-400"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div
            key={`${item.label}-${index}`}
            className="flex min-w-0 items-center gap-2"
          >
            {index > 0 ? (
              <ChevronRight className="size-3.5 text-slate-400 sm:size-4 sm:text-slate-500" />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="max-w-[40vw] truncate font-semibold text-slate-700 transition-colors hover:text-slate-950 sm:max-w-none sm:font-medium sm:text-slate-600 sm:hover:text-slate-900"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={[
                  "min-w-0 max-w-full truncate",
                  isLast ? "font-bold text-slate-950 sm:font-semibold sm:text-slate-900" : "",
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
