import Image from "next/image";
import {
  resolveHomeKeyServices,
  resolveServicesKeyServices,
} from "@/lib/site-key-services";
import HeroCtaLink from "@/components/kinetic/hero-cta-link";

export default function SiteKeyServicesSection({ settings, variant = "home" }) {
  const ks =
    variant === "services"
      ? resolveServicesKeyServices(settings)
      : resolveHomeKeyServices(settings);
  const showCard3Cta = Boolean(ks.card3.ctaLabel && ks.card3.ctaHref);

  return (
    <section className="bg-black py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-6 sm:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="block text-xs font-extrabold uppercase tracking-[0.25em] text-orange-200/90">
              {ks.eyebrow}
            </span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {ks.headline}
            </h2>
          </div>
          <p className="max-w-md whitespace-pre-line text-sm leading-relaxed text-zinc-400 md:text-right">
            {ks.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
          <div className="group relative min-h-[280px] overflow-hidden rounded-xl border border-white/10 bg-zinc-900 md:col-span-8 md:min-h-[300px]">
            {ks.card1.showImage ? (
              <Image
                src={ks.card1.imageUrl}
                alt={ks.card1.imageAlt}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 70vw"
              />
            ) : null}
            {ks.card1.showImage ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/65 to-zinc-950/30" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(249,115,22,0.2),transparent_55%)] opacity-80" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(249,115,22,0.18),transparent_55%)] opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 to-transparent" />
              </>
            )}
            <div className="relative z-10 p-6 sm:p-10">
              <h3 className="font-heading text-2xl font-extrabold text-zinc-50 sm:text-3xl">
                {ks.card1.title}
              </h3>
              <p className="mt-2 max-w-sm whitespace-pre-line text-sm text-zinc-300">
                {ks.card1.body}
              </p>
              <HeroCtaLink
                href={ks.card1.ctaHref}
                className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-orange-300 transition group-hover:gap-4"
              >
                {ks.card1.ctaLabel} <span aria-hidden>→</span>
              </HeroCtaLink>
            </div>
          </div>

          <div className="relative flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900 md:col-span-4">
            {ks.card2.showImage ? (
              <Image
                src={ks.card2.imageUrl}
                alt={ks.card2.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 36vw"
              />
            ) : null}
            {ks.card2.showImage ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/45 via-zinc-950/80 to-zinc-950" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.12),transparent_50%)]" />
              </>
            ) : null}
            <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-10">
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-xs font-black text-orange-200">
                  {ks.card2.iconLabel}
                </div>
                <h3 className="font-heading text-xl font-extrabold text-zinc-50 sm:text-2xl">
                  {ks.card2.title}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm text-zinc-300">
                  {ks.card2.body}
                </p>
              </div>
              <div
                className={`mt-8 border-t pt-6 ${
                  ks.card2.showImage
                    ? "border-white/15 bg-zinc-950/70 backdrop-blur-sm"
                    : "border-white/10"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-zinc-500">
                  {ks.card2.priceLabel}
                </span>
                <p className="mt-2 font-heading text-xl font-extrabold text-zinc-50">
                  {ks.card2.price}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900 md:col-span-4">
            {ks.card3.showImage ? (
              <Image
                src={ks.card3.imageUrl}
                alt={ks.card3.imageAlt}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 36vw"
              />
            ) : null}
            {ks.card3.showImage ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/70 to-zinc-950/35" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(249,115,22,0.16),transparent_55%)]" />
              </>
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.12),transparent_55%)]" />
            )}
            <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-10">
              <div>
                <h3 className="font-heading text-xl font-extrabold text-zinc-50 sm:text-2xl">
                  {ks.card3.title}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm text-zinc-300">
                  {ks.card3.body}
                </p>
              </div>
              {showCard3Cta ? (
                <HeroCtaLink
                  href={ks.card3.ctaHref}
                  className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-orange-300 transition hover:gap-3"
                >
                  {ks.card3.ctaLabel} <span aria-hidden>→</span>
                </HeroCtaLink>
              ) : (
                <div
                  className="mt-8 inline-flex h-12 w-12 items-center justify-center rounded-lg border-2 border-orange-500 text-lg font-light text-orange-300"
                  aria-hidden
                >
                  +
                </div>
              )}
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900 md:col-span-8">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/40 to-transparent md:from-zinc-950/90" />
            <div className="relative grid h-full gap-8 p-6 sm:p-10 md:grid-cols-2">
              <div className="relative z-10">
                <h3 className="font-heading text-2xl font-extrabold text-zinc-50 sm:text-3xl">
                  {ks.card4.title}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm text-zinc-300">
                  {ks.card4.body}
                </p>
                <HeroCtaLink
                  href={ks.card4.ctaHref}
                  className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-black uppercase tracking-tight text-zinc-950 transition hover:bg-orange-500 hover:text-white"
                >
                  {ks.card4.ctaLabel}
                </HeroCtaLink>
              </div>
              <div className="relative z-10 min-h-[220px] w-full md:min-h-[280px]">
                {ks.card4.showImage ? (
                  <Image
                    src={ks.card4.imageUrl}
                    alt={ks.card4.imageAlt}
                    fill
                    className="rounded-xl border border-white/10 object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                ) : (
                  <div className="absolute inset-0 min-h-[220px] rounded-xl border border-white/10 bg-white/5 md:min-h-0" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
