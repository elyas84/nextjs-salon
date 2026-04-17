import Image from "next/image";
import SiteHeroSection from "@/components/kinetic/site-hero-section";
import SiteKeyServicesSection from "@/components/kinetic/site-key-services-section";
import HeroCtaLink from "@/components/kinetic/hero-cta-link";
import { isUsableImageUrl } from "@/lib/site-hero";
import { resolveServicesStandardBanner } from "@/lib/services-standard-banner";
import { getSiteSettings } from "@/lib/site-settings-service";

export const metadata = {
  title: "Services",
  description: "Precision engineering services and clinical-grade maintenance.",
};

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const settings = await getSiteSettings();
  return (
    <div className="bg-zinc-950">
      <SiteHeroSection settings={settings} variant="services" />
      <SiteKeyServicesSection settings={settings} variant="services" />
      <StandardBanner settings={settings} />
    </div>
  );
}

function StandardBanner({ settings }) {
  const b = resolveServicesStandardBanner(settings);
  const bgUrl = String(settings?.servicesStandardBannerImageUrl || "").trim();
  const bgAlt = String(settings?.servicesStandardBannerImageAlt || "").trim();
  const showBg = isUsableImageUrl(bgUrl);

  const bullets = [b.bullet1, b.bullet2, b.bullet3].filter(Boolean);

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        <div className="relative px-6 py-14 sm:px-10 md:px-12 md:py-16">
          {showBg ? (
            <div className="pointer-events-none absolute inset-0 z-0 opacity-25">
              <Image
                src={bgUrl}
                alt={bgAlt || "Banner"}
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-zinc-950/80" />
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden">
            <span className="select-none font-heading text-[7rem] font-black uppercase leading-none text-white/5 sm:text-[10rem] md:text-[14rem]">
              {b.watermark}
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-heading text-3xl font-extrabold text-zinc-50 sm:text-4xl">
                {b.headline}
              </h2>
              <ul className="mt-6 space-y-4 text-xs font-extrabold uppercase tracking-widest text-zinc-300">
                {bullets.map((text, i) => (
                  <li key={`${i}-${text}`} className="flex items-center gap-3">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-orange-500/30 bg-orange-500/10 text-orange-300">
                      ✓
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:flex-col md:items-stretch">
              <HeroCtaLink
                href={b.primaryCtaHref}
                className="inline-flex items-center justify-center rounded-md bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-zinc-950 transition hover:bg-orange-500 hover:text-white"
              >
                {b.primaryCtaLabel}
              </HeroCtaLink>
              <HeroCtaLink
                href={b.secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-8 py-4 text-xs font-black uppercase tracking-widest text-zinc-50 transition hover:bg-white/10"
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
