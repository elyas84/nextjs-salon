export default function BookingHero() {
  return (
    <section className="relative overflow-hidden border-b border-stone-800/60 bg-[#0a0908]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_-10%,rgba(253,230,138,0.09),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_20%,rgba(244,114,182,0.05),transparent_45%)]" />

      <div className="relative mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-200/85">
          Booking
        </p>
        <h1 className="mt-6 max-w-3xl font-heading text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1.08] tracking-tight text-stone-50">
          <span className="block text-stone-200/95">Request your</span>
          <span className="mt-1 block bg-gradient-to-r from-amber-100 via-rose-200 to-rose-300 bg-clip-text font-medium text-transparent">
            salon visit
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-stone-400 sm:text-base">
          Tell us what you need, pick a time that works, and we&apos;ll confirm
          your appointment by email — usually within one business day.
        </p>
      </div>
    </section>
  );
}
