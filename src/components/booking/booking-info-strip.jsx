const ITEMS = [
  { title: "Clean tools", desc: "Sanitized stations and mindful spacing." },
  { title: "Honest timing", desc: "We quote length before we start." },
  { title: "Care plans", desc: "Take-home steps to keep your look fresh." },
];

export default function BookingInfoStrip() {
  return (
    <section className="border-t border-stone-800/70 bg-[#080706] py-14 sm:py-16">
      <div className="mx-auto grid w-full max-w-screen-2xl gap-4 px-4 sm:grid-cols-3 sm:gap-5 sm:px-6 lg:px-8">
        {ITEMS.map((i) => (
          <div
            key={i.title}
            className="rounded-2xl border border-stone-800/70 bg-stone-950/40 p-5 transition-colors duration-200 hover:border-stone-700 hover:bg-stone-900/35"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200/85">
              {i.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              {i.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
