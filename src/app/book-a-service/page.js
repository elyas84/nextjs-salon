import BookingFormClient from "./BookingFormClient";

export const metadata = {
  title: "Book a Service",
  description: "Schedule a consultation and book a service appointment.",
};

export default function BookAServicePage() {
  return (
    <div className="space-y-16 bg-zinc-950 sm:space-y-20">
      <Header />
      <BookingForm />
      <InfoStrip />
    </div>
  );
}

function Header() {
  return (
    <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.15),transparent)]" />
      <div className="relative mx-auto w-full max-w-screen-2xl text-left">
        <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-orange-300">
          Booking
        </p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tighter text-zinc-50 sm:text-5xl lg:text-6xl">
          Book a service
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Share a few details about your vehicle and what you need. We’ll
          reply with available times and next steps.
        </p>
      </div>
    </section>
  );
}

function BookingForm() {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col items-stretch gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="surface-panel w-full min-w-0 flex-1 rounded-2xl border border-white/[0.07] p-5 shadow-[0_20px_64px_-20px_rgba(0,0,0,0.65)] transition-[box-shadow,border-color] duration-300 sm:p-6 lg:max-w-3xl xl:max-w-[52rem]">
          <h2 className="font-heading text-lg font-extrabold tracking-tight text-zinc-50 sm:text-xl">
            Appointment details
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 sm:text-[13px]">
            Fields marked with <span className="text-orange-400/90">*</span>{" "}
            are required. We’ll follow up by email.
          </p>

          <BookingFormClient />
        </div>

        <aside className="surface-panel w-full max-w-[min(100%,24rem)] shrink-0 rounded-2xl border border-white/[0.07] p-6 sm:max-w-[26rem] sm:p-7 lg:sticky lg:top-24">
          <h3 className="font-heading text-lg font-extrabold tracking-tight text-zinc-50 sm:text-xl">
            What happens next
          </h3>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-[15px] sm:leading-relaxed">
            {[
              "We review your request and confirm parts and bay time.",
              "We email you with slots and an estimated cost range.",
              "You confirm, then your appointment is locked in.",
            ].map((t) => (
              <li key={t} className="flex gap-3.5">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-[11px] font-black text-orange-300">
                  ✓
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-500">
              Hours
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
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

function InfoStrip() {
  const items = [
    { title: "OEM parts", desc: "Sourced and verified for fitment." },
    { title: "Telemetry", desc: "Repeatable diagnostics & reporting." },
    { title: "Warranty", desc: "Integrity-backed workmanship." },
  ];
  return (
    <section className="border-t border-white/10 bg-zinc-950 py-12 sm:py-14">
      <div className="mx-auto grid w-full max-w-screen-2xl gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {items.map((i) => (
          <div
            key={i.title}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors duration-200 hover:border-white/10 hover:bg-white/[0.04]"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-orange-300">
              {i.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {i.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
