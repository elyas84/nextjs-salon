import Image from "next/image";
import HeroCtaLink from "@/components/kinetic/hero-cta-link";
import NoImage from "@/components/ui/NoImage";
import { isUsableImageUrl } from "@/lib/site-hero";
import { resolveServicesStandardBanner } from "@/lib/services-standard-banner";

export default function ServicesStandardBanner({ settings }) {
  const b = resolveServicesStandardBanner(settings);
  const bgUrl = String(settings?.servicesStandardBannerImageUrl || "").trim();
  const bgAlt = String(settings?.servicesStandardBannerImageAlt || "").trim();
  const showBg = isUsableImageUrl(bgUrl);

  const bullets = [b.bullet1, b.bullet2, b.bullet3].filter(Boolean);

  return (
    <section className="bg-[#080706] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-screen-2xl overflow-hidden rounded-3xl border border-stone-800/80 bg-[#0c0b09] shadow-[0_32px_80px_-40px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.04]">
        <div className="relative px-6 py-12 sm:px-10 sm:py-14 md:px-12 md:py-16">
          {showBg ? (
            <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
              <Image
                src={bgUrl}
                alt={bgAlt || "Banner"}
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-[#0a0908]/85" />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
              <NoImage
                fill
                tone="stone"
                className="rounded-3xl border-stone-800/40"
              />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden">
            <span className="select-none font-heading text-[6.5rem] font-semibold uppercase leading-none text-stone-800/40 sm:text-[9rem] md:text-[12rem]">
              {b.watermark}
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/75">
                Why us
              </p>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl">
                {b.headline}
              </h2>
              <ul className="mt-8 space-y-4 text-sm font-medium leading-relaxed text-stone-300">
                {bullets.map((text, i) => (
                  <li key={`${i}-${text}`} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">
                      ✓
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:flex-col md:items-stretch">
              <HeroCtaLink
                href={b.primaryCtaHref}
                className="inline-flex min-w-[12rem] items-center justify-center rounded-full bg-stone-100 px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-950 transition hover:bg-amber-50"
              >
                {b.primaryCtaLabel}
              </HeroCtaLink>
              <HeroCtaLink
                href={b.secondaryCtaHref}
                className="inline-flex min-w-[12rem] items-center justify-center rounded-full border border-stone-600/70 bg-transparent px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-100 transition hover:border-stone-500 hover:bg-white/[0.05]"
              >
                {b.secondaryCtaLabel}
              </HeroCtaLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
