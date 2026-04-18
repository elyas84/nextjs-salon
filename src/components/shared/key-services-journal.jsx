import Image from "next/image";
import HeroCtaLink from "@/components/kinetic/hero-cta-link";
import NoImage from "@/components/ui/NoImage";

/** Editorial “chapters” grid — pass resolved key-services from home or services CMS. */
export default function KeyServicesJournal({ ks }) {
  const showCard3Cta = Boolean(ks.card3.ctaLabel && ks.card3.ctaHref);

  const chapters = [
    {
      n: "01",
      title: ks.card1.title,
      body: ks.card1.body,
      cta: { label: ks.card1.ctaLabel, href: ks.card1.ctaHref },
      image: ks.card1,
    },
    {
      n: "02",
      title: ks.card2.title,
      body: ks.card2.body,
      meta: `${ks.card2.priceLabel} ${ks.card2.price}`,
      image: ks.card2,
    },
    {
      n: "03",
      title: ks.card3.title,
      body: ks.card3.body,
      cta:
        showCard3Cta
          ? { label: ks.card3.ctaLabel, href: ks.card3.ctaHref }
          : null,
      image: ks.card3,
    },
    {
      n: "04",
      title: ks.card4.title,
      body: ks.card4.body,
      cta: { label: ks.card4.ctaLabel, href: ks.card4.ctaHref },
      image: ks.card4,
    },
  ];

  return (
    <section className="relative border-b border-stone-800/50 bg-[#0c0b09] py-20 sm:py-28">
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-amber-200/15 to-transparent" />

      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-3xl lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-200/80">
            {ks.eyebrow}
          </p>
          <h2 className="mt-5 font-heading text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-tight tracking-tight text-stone-100">
            {ks.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-sm leading-relaxed text-stone-500 lg:mx-0 lg:max-w-2xl">
            {ks.intro}
          </p>
        </div>

        <div className="mt-16 space-y-0 lg:mt-20">
          {chapters.map((ch, i) => (
            <article
              key={ch.n}
              className="grid gap-10 border-t border-stone-800/70 py-14 first:border-t-0 first:pt-0 sm:py-16 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-20"
            >
              <div
                className={`relative lg:col-span-5 ${
                  i % 2 === 1 ? "lg:order-2" : ""
                }`}
              >
                <span
                  className="pointer-events-none select-none font-heading text-[clamp(4rem,14vw,7rem)] font-light leading-none text-stone-800/90"
                  aria-hidden
                >
                  {ch.n}
                </span>
                <div className="relative -mt-8 aspect-[16/11] overflow-hidden rounded-2xl ring-1 ring-white/[0.06] sm:-mt-12">
                  {ch.image.showImage ? (
                    <>
                      <Image
                        src={ch.image.imageUrl}
                        alt={ch.image.imageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 40vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b09]/55 to-transparent" />
                    </>
                  ) : (
                    <NoImage
                      fill
                      tone="stone"
                      className="rounded-2xl border-stone-800/50"
                    />
                  )}
                </div>
              </div>

              <div
                className={`lg:col-span-7 ${
                  i % 2 === 1
                    ? "lg:order-1 lg:flex lg:flex-col lg:items-end lg:text-right"
                    : ""
                }`}
              >
                {ch.n === "02" && ks.card2.iconLabel ? (
                  <span className="inline-block rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/90">
                    {ks.card2.iconLabel}
                  </span>
                ) : null}
                <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
                  {ch.title}
                </h3>
                <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-relaxed text-stone-500 sm:text-[15px] lg:leading-relaxed">
                  {ch.body}
                </p>
                {"meta" in ch && ch.meta ? (
                  <p className="mt-6 font-heading text-lg text-amber-100/90">
                    {ch.meta}
                  </p>
                ) : null}
                {ch.cta ? (
                  <HeroCtaLink
                    href={ch.cta.href}
                    className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-rose-300/95 transition hover:gap-3"
                  >
                    {ch.cta.label}
                    <span aria-hidden>→</span>
                  </HeroCtaLink>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
