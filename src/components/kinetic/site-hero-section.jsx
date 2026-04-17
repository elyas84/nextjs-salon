import Image from "next/image";
import {
  isUsableImageUrl,
  resolveAboutHero,
  resolveHomeHero,
  resolveServicesHero,
} from "@/lib/site-hero";
import HeroCtaLink from "@/components/kinetic/hero-cta-link";

export default function SiteHeroSection({ settings, variant = "home" }) {
  const hero =
    variant === "services"
      ? resolveServicesHero(settings)
      : variant === "about"
        ? resolveAboutHero(settings)
        : resolveHomeHero(settings);
  const showImage = isUsableImageUrl(hero.imageUrl);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden border-b border-white/[0.04] bg-zinc-950">
      <div className="absolute inset-0">
        {showImage ? (
          <>
            <div className="relative size-full">
              <Image
                src={hero.imageUrl}
                alt={hero.imageAlt}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/92 via-zinc-950/65 to-zinc-950/25" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(244,114,182,0.14),transparent_55%)]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
            <div className="h-full w-full bg-[radial-gradient(circle_at_70%_30%,rgba(244,114,182,0.18),transparent_55%)]" />
          </>
        )}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-rose-200">
              {hero.badgeText}
            </span>
          </div>

          <h1 className="font-heading text-5xl font-extrabold tracking-tighter text-zinc-50 sm:text-6xl lg:text-7xl">
            {hero.titleLine1} <br />
            <span className="kinetic-gradient-text">{hero.titleLine2}</span>
          </h1>

          <p className="mt-6 max-w-xl whitespace-pre-line text-base font-light leading-relaxed text-zinc-300 sm:text-lg">
            {hero.description}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <HeroCtaLink
              href={hero.primaryCtaHref}
              className="kinetic-gradient inline-flex items-center justify-center rounded-md px-7 py-4 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition active:scale-[0.99] hover:shadow-[0_0_24px_rgba(244,114,182,0.35)]"
            >
              {hero.primaryCtaLabel}
            </HeroCtaLink>
            <HeroCtaLink
              href={hero.secondaryCtaHref}
              className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-7 py-4 text-sm font-black uppercase tracking-tight text-zinc-100 transition hover:bg-white hover:text-zinc-950"
            >
              {hero.secondaryCtaLabel}
            </HeroCtaLink>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-10 left-1/2 z-10 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Explore
          </span>
          <div className="h-12 w-px bg-gradient-to-b from-rose-400 to-transparent" />
        </div>
      </div>
    </section>
  );
}
