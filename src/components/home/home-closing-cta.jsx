import Link from "next/link";

export default function HomeClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-stone-800/60 bg-[#0a0908] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(244,114,182,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(253,230,138,0.04),transparent_40%)]" />

      <div className="relative mx-auto max-w-screen-lg px-4 text-center sm:px-6">
        <blockquote className="font-heading text-2xl font-medium leading-snug text-stone-200 sm:text-3xl sm:leading-snug">
          “The best hair days are the ones that still feel like{' '}
          <span className="text-amber-100/90">you</span> — just a little more
          polished.”
        </blockquote>
        <p className="mx-auto mt-10 max-w-md text-sm leading-relaxed text-stone-500">
          Book online, drop us a note, or shop products — we&apos;ll meet you
          wherever you are in your routine.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <Link
            href="/book-a-service"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-stone-100 px-10 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-stone-950 transition hover:bg-amber-50"
          >
            Book
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full border border-stone-600/90 px-10 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-stone-200 transition hover:border-stone-500 hover:bg-white/[0.03]"
          >
            Contact
          </Link>
        </div>
      </div>
    </section>
  );
}
