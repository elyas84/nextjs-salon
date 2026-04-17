/** Editorial intro for /products — matches home/services stone–amber shell. */
export default function ProductsShopHeader() {
  return (
    <div className="relative border-b border-stone-800/60 bg-[#0a0908]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_-10%,rgba(253,230,138,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_0%,rgba(244,114,182,0.04),transparent_50%)]" />
      <div className="relative mx-auto max-w-screen-2xl px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-14 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-200/85">
          Salon retail
        </p>
        <h1 className="mt-5 max-w-3xl font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-tight text-stone-50">
          <span className="text-stone-200/95">Hair care &amp; styling</span>{" "}
          <span className="bg-gradient-to-r from-amber-100 via-rose-200 to-rose-300 bg-clip-text font-medium text-transparent">
            essentials
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-stone-400 sm:text-base">
          Products we use and recommend — shampoos, treatments, tools, and
          finishing touches to keep your look fresh between visits.
        </p>
      </div>
    </div>
  );
}
