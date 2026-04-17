import Image from "next/image";
import { isUsableImageUrl, resolveServicesHero } from "@/lib/site-hero";
import HeroCtaLink from "@/components/kinetic/hero-cta-link";

const SERVICES_HERO_STATS = [
  { k: "Studio", v: "Appointments" },
  { k: "Focus", v: "Cut & color" },
  { k: "Care", v: "Treatments" },
];

export default function ServicesHero({ settings }) {
  const hero = resolveServicesHero(settings);
  const showImage = isUsableImageUrl(hero.imageUrl);

  return (
    <section className="relative overflow-hidden border-b border-stone-800/60 bg-[#0a0908]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_-10%,rgba(253,230,138,0.09),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_30%,rgba(244,114,182,0.05),transparent_45%)]" />

      <div className="relative mx-auto grid max-w-screen-2xl gap-10 px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="flex flex-col justify-center lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-200/85">
            {hero.badgeText}
          </p>

          <h1 className="mt-8 font-heading text-[clamp(2.5rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-tight text-stone-50">
            <span className="block text-stone-200/95">{hero.titleLine1}</span>
            <span className="mt-1 block bg-gradient-to-r from-amber-100 via-rose-200 to-rose-300 bg-clip-text font-medium text-transparent">
              {hero.titleLine2}
            </span>
          </h1>

          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-stone-400 sm:text-base">
            {hero.description}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <HeroCtaLink
              href={hero.primaryCtaHref}
              className="inline-flex items-center justify-center rounded-full bg-stone-100 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-950 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:bg-amber-50"
            >
              {hero.primaryCtaLabel}
            </HeroCtaLink>
            <HeroCtaLink
              href={hero.secondaryCtaHref}
              className="inline-flex items-center justify-center rounded-full border border-stone-600/80 bg-transparent px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-200 transition hover:border-stone-500 hover:bg-white/[0.04]"
            >
              {hero.secondaryCtaLabel}
            </HeroCtaLink>
          </div>

          <dl className="mt-14 grid w-full max-w-lg grid-cols-3 gap-x-6 gap-y-3 border-t border-stone-800/70 pt-10 sm:gap-x-8">
            {SERVICES_HERO_STATS.map((row) => (
              <dt
                key={`h-${row.k}`}
                className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500"
              >
                {row.k}
              </dt>
            ))}
            {SERVICES_HERO_STATS.map((row) => (
              <dd
                key={`v-${row.k}`}
                className="font-heading text-[0.9375rem] font-semibold leading-snug tracking-tight text-balance text-stone-100"
              >
                {row.v}
              </dd>
            ))}
          </dl>
        </div>

        <div className="relative lg:col-span-7">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.07] sm:aspect-[16/11] lg:aspect-auto lg:min-h-[min(640px,78svh)]">
            {showImage ? (
              <>
                <Image
                  src={hero.imageUrl}
                  alt={hero.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908]/90 via-[#0a0908]/15 to-transparent lg:bg-gradient-to-l lg:from-[#0a0908]/75 lg:via-transparent lg:to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-[#0a0908]" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(253,230,138,0.12),transparent_50%)] mix-blend-overlay" />
          </div>

          <div className="pointer-events-none absolute -bottom-6 left-6 right-6 hidden rounded-2xl border border-stone-700/40 bg-stone-900/40 px-6 py-4 backdrop-blur-md lg:block">
            <p className="text-center font-heading text-sm italic text-stone-400">
              Every service starts with listening — then we shape, color, and
              finish with care.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
