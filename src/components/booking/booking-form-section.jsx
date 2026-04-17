import BookingFormClient from "@/app/book-a-service/BookingFormClient";

export default function BookingFormSection() {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col items-stretch gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="w-full min-w-0 flex-1 rounded-3xl border border-stone-800/80 bg-[#0c0b09]/90 p-5 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.04] backdrop-blur-sm transition-[box-shadow,border-color] duration-300 sm:p-6 lg:max-w-3xl xl:max-w-[52rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-stone-500">
            Form
          </p>
          <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-stone-50 sm:text-2xl">
            Request an appointment
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-stone-500 sm:text-[13px]">
            Four steps — contact, service, schedule, then confirm. Fields marked
            with <span className="text-amber-400/95">*</span> are required.
            We&apos;ll follow up by email.
          </p>

          <BookingFormClient />
        </div>

        <aside className="surface-panel w-full max-w-[min(100%,24rem)] shrink-0 rounded-3xl border border-stone-800/80 bg-[#0c0b09]/80 p-6 sm:max-w-[26rem] sm:p-7 lg:sticky lg:top-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-stone-500">
            Next steps
          </p>
          <h3 className="mt-2 font-heading text-lg font-semibold tracking-tight text-stone-50 sm:text-xl">
            What happens next
          </h3>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed text-stone-400 sm:text-[15px] sm:leading-relaxed">
            {[
              "We review your request and check stylist availability.",
              "We email you to confirm or suggest a nearby time.",
              "You reply, and your appointment is on the calendar.",
            ].map((t) => (
              <li key={t} className="flex gap-3.5">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/10 text-[11px] font-bold text-amber-200">
                  ✓
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 rounded-2xl border border-stone-700/60 bg-stone-950/50 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              Hours
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-300 sm:text-[15px]">
              Mon–Fri · 9:00–18:00
              <br />
              Sat · 10:00–15:00
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
