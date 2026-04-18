import Image from "next/image";
import HeroCtaLink from "@/components/kinetic/hero-cta-link";
import NoImage from "@/components/ui/NoImage";

/**
 * Home + Services: bento-style grid — hero card (large) + three smaller tiles on lg+.
 */
export default function KeyServicesJournal({ ks }) {
  const showCard3Cta = Boolean(ks.card3.ctaLabel && ks.card3.ctaHref);

  const items = [
    {
      n: "01",
      title: ks.card1.title,
      body: ks.card1.body,
      cta: { label: ks.card1.ctaLabel, href: ks.card1.ctaHref },
      image: ks.card1,
      badge: null,
      meta: null,
    },
    {
      n: "02",
      title: ks.card2.title,
      body: ks.card2.body,
      cta: null,
      image: ks.card2,
      badge: ks.card2.iconLabel || null,
      meta: `${ks.card2.priceLabel} ${ks.card2.price}`.trim(),
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
      badge: null,
      meta: null,
    },
    {
      n: "04",
      title: ks.card4.title,
      body: ks.card4.body,
      cta: { label: ks.card4.ctaLabel, href: ks.card4.ctaHref },
      image: ks.card4,
      badge: null,
      meta: null,
    },
  ];

  return (
    <section className="relative border-b border-stone-800/50 bg-[#0a0908] py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-amber-200/15 to-transparent" />

      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl lg:max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-amber-200/75">
            {ks.eyebrow}
          </p>
          <h2 className="mt-3 font-heading text-[clamp(1.5rem,3.2vw,2.35rem)] font-semibold leading-[1.15] tracking-tight text-stone-100">
            {ks.headline}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-500 sm:text-[15px]">
            {ks.intro}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-7 sm:mt-16 sm:gap-8 lg:mt-20 lg:grid-cols-12 lg:grid-rows-2 lg:items-stretch lg:gap-5 xl:gap-6">
          {items.map((ch, i) => {
            const isHero = i === 0;
            const isWide = i === 3;

            const cellClass =
              i === 0
                ? "lg:col-span-6 lg:row-span-2 lg:row-start-1"
                : i === 1
                  ? "lg:col-span-3 lg:col-start-7 lg:row-start-1"
                  : i === 2
                    ? "lg:col-span-3 lg:col-start-10 lg:row-start-1"
                    : "lg:col-span-6 lg:col-start-7 lg:row-start-2";

            const imageShellClass = isHero
              ? "relative aspect-[4/3] overflow-hidden bg-stone-900/50 lg:aspect-[3/4]"
              : isWide
                ? "relative aspect-[3/2] overflow-hidden bg-stone-900/50 lg:aspect-[5/3]"
                : "relative aspect-[3/2] overflow-hidden bg-stone-900/50";

            const bodyClass = isHero
              ? "flex flex-1 flex-col p-6 sm:p-7 lg:p-8"
              : "flex flex-1 flex-col p-5 sm:p-6 lg:p-6";

            const titleClass = isHero
              ? "font-heading text-xl font-semibold leading-snug tracking-tight text-stone-50 sm:text-2xl"
              : "font-heading text-base font-semibold leading-snug tracking-tight text-stone-50 sm:text-lg";

            const copyClass = isHero
              ? "mt-4 flex-1 text-sm leading-[1.65] text-stone-500 sm:text-[15px]"
              : "mt-3 flex-1 text-sm leading-relaxed text-stone-500";

            return (
              <article
                key={ch.n}
                className={`group flex min-h-0 flex-col overflow-hidden rounded-2xl border border-stone-800/70 bg-[#0c0b09] shadow-[0_20px_50px_-40px_rgba(0,0,0,0.85)] transition hover:border-stone-600/50 hover:shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] ${cellClass}`}
              >
                <div className={imageShellClass}>
                  {ch.image.showImage ? (
                    <>
                      <Image
                        src={ch.image.imageUrl}
                        alt={ch.image.imageAlt}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes={
                          isHero
                            ? "(max-width: 1024px) 100vw, 34vw"
                            : "(max-width: 1024px) 100vw, 22vw"
                        }
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b09]/70 via-transparent to-transparent" />
                    </>
                  ) : (
                    <NoImage
                      fill
                      tone="stone"
                      className="rounded-none border-stone-800/40"
                    />
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded-md bg-stone-950/90 font-heading font-semibold tabular-nums text-stone-400 ring-1 ring-white/[0.08] ${
                      isHero
                        ? "px-2.5 py-1 text-xs"
                        : "px-2 py-1 text-[11px]"
                    }`}
                  >
                    {ch.n}
                  </span>
                </div>

                <div className={bodyClass}>
                  {ch.badge ? (
                    <span className="mb-2 inline-flex w-fit rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-100/90">
                      {ch.badge}
                    </span>
                  ) : null}
                  <h3 className={titleClass}>{ch.title}</h3>
                  <p className={copyClass}>{ch.body}</p>
                  {ch.meta ? (
                    <p
                      className={`font-heading font-medium text-amber-100/90 ${
                        isHero
                          ? "mt-5 text-lg sm:text-xl"
                          : "mt-4 text-base sm:text-lg"
                      }`}
                    >
                      {ch.meta}
                    </p>
                  ) : null}
                  {ch.cta?.label && ch.cta?.href ? (
                    <HeroCtaLink
                      href={ch.cta.href}
                      className={`inline-flex w-fit items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-300/95 transition hover:gap-3 ${
                        isHero ? "mt-6" : "mt-5"
                      }`}
                    >
                      {ch.cta.label}
                      <span aria-hidden>→</span>
                    </HeroCtaLink>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
