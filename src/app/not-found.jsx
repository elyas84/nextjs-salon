import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";

export const metadata = {
  title: "404 - Out of Bounds",
  description:
    "The coordinates you've provided have led us into uncharted territory.",
};

export default function NotFound() {
  return (
    <section className="relative min-h-[calc(100svh-160px)] overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-xs font-extrabold uppercase tracking-[0.25em] text-zinc-500">
            No image
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[calc(100svh-160px)] items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <div className="max-w-4xl">
            <div className="mb-4 flex items-center gap-4">
              <div className="h-[2px] w-12 bg-orange-500" />
              <span className="text-xs font-extrabold uppercase tracking-[0.3em] text-orange-300">
                Error Protocol 404
              </span>
            </div>

            <h1 className="font-heading text-5xl font-black tracking-tighter leading-none text-white sm:text-7xl md:text-8xl">
              OUT OF <br />
              <span className="kinetic-gradient-text">BOUNDS.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-300 sm:text-xl md:text-2xl">
              The coordinates you&apos;ve provided have led us into uncharted territory.
              Your current path has reached a technical dead end.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/"
                className="kinetic-gradient inline-flex items-center gap-3 rounded-md px-7 py-4 text-sm font-black uppercase tracking-tight text-zinc-950 transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Home className="size-4" />
                Return to Pit Lane
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-3 rounded-md border border-white/10 px-7 py-4 text-sm font-black uppercase tracking-tight text-white transition-colors hover:bg-white/10"
              >
                View Components <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  title: "Diagnostics",
                  desc: "Check system status and engine health logs.",
                  href: "/dashboard",
                },
                {
                  title: "Transmission",
                  desc: "Browse performance parts and upgrades.",
                  href: "/products",
                },
                {
                  title: "Assistance",
                  desc: "Direct line to our precision engineering support.",
                  href: "/contact",
                },
              ].map((item) => (
                <Link key={item.title} href={item.href} className="group">
                  <div className="text-sm font-black uppercase tracking-widest text-white transition-colors group-hover:text-orange-300">
                    {item.title}
                  </div>
                  <div className="mt-2 h-px w-full bg-white/10">
                    <div className="h-full w-0 bg-orange-500 transition-all duration-500 group-hover:w-full" />
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-zinc-300">
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
