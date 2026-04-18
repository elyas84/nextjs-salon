"use client";

import Image from "next/image";
import AboutHero from "@/components/about/about-hero";
import NoImage from "@/components/ui/NoImage";
import HeroCtaLink from "@/components/kinetic/hero-cta-link";
import { isUsableImageUrl } from "@/lib/site-hero";
import {
  initialsFromName,
  orderToStarLevel,
} from "@/lib/testimonial-initials";
import { Star } from "lucide-react";

function txt(s, key, fallback) {
  const v = String(s?.[key] ?? "").trim();
  return v || fallback;
}

function resolveTestimonials(testimonialsData) {
  const rows = Array.isArray(testimonialsData?.testimonials)
    ? testimonialsData.testimonials
    : [];
  const sectionHeadline =
    String(testimonialsData?.sectionHeadline || "").trim() ||
    "CLIENT VOICES";
  const items = rows
    .map((t) => ({
      key: t.id,
      quote: String(t.quote || "").trim(),
      name: String(t.name || "").trim(),
      label: String(t.label || "").trim(),
      order: Number.isFinite(Number(t.order)) ? Number(t.order) : 0,
    }))
    .filter((t) => t.quote && t.name);

  return {
    sectionHeadline,
    items,
    hasTestimonials: items.length > 0,
  };
}

export default function AboutPageClient({
  settings,
  testimonialsData = null,
}) {
  const heritage = String(settings?.aboutHeritageImageUrl || "").trim();
  const ctaBg = String(settings?.aboutCtaBackgroundImageUrl || "").trim();
  const showHeritage = heritage && isUsableImageUrl(heritage);
  const showCtaBg = ctaBg && isUsableImageUrl(ctaBg);

  const { sectionHeadline, items: testimonials, hasTestimonials } =
    resolveTestimonials(testimonialsData);

  return (
    <div className="bg-[#0a0908]">
      <AboutHero settings={settings} />

      <section className="relative border-b border-stone-800/50 bg-[#0c0b09] py-20 sm:py-28">
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-amber-200/15 to-transparent" />

        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
            <div className="surface-panel rounded-2xl border border-stone-800/60 p-8 lg:col-span-7 lg:p-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-200/80">
                {txt(settings, "aboutHeritageEyebrow", "Our story")}
              </p>
              <h2 className="mt-5 font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight text-stone-100">
                {txt(settings, "aboutHeritageHeadline", "OUR HERITAGE")}
              </h2>
              <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-stone-500 sm:text-base">
                {txt(
                  settings,
                  "aboutHeritageBody",
                  "Studio Salon began as a small chair-and-mirror studio and grew into a neighborhood destination for thoughtful hair and beauty. We still believe the best results start with listening — then cut, color, and finish with care.",
                )}
              </p>

              <div className="mt-10 grid grid-cols-2 gap-8 border-t border-stone-800/70 pt-8">
                <div>
                  <span className="block font-heading text-4xl font-semibold text-amber-100/95">
                    {txt(settings, "aboutHeritageStat1Value", "25+")}
                  </span>
                  <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                    {txt(settings, "aboutHeritageStat1Label", "Years in the chair")}
                  </span>
                </div>
                <div>
                  <span className="block font-heading text-4xl font-semibold text-amber-100/95">
                    {txt(settings, "aboutHeritageStat2Value", "12k+")}
                  </span>
                  <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                    {txt(settings, "aboutHeritageStat2Label", "Guests styled")}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/[0.06] lg:col-span-5">
              {showHeritage ? (
                <div className="relative h-full min-h-80 w-full lg:min-h-full">
                  <Image
                    src={heritage}
                    alt={settings?.aboutHeritageImageAlt || "Heritage"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
              ) : (
                <div className="relative min-h-80 w-full lg:min-h-full">
                  <NoImage
                    fill
                    tone="stone"
                    size="compact"
                    className="rounded-2xl border-stone-800/50"
                  />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c0b09]/90 via-[#0c0b09]/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8">
                <span className="font-heading text-lg font-semibold text-stone-100 sm:text-xl">
                  {txt(settings, "aboutHeritageImageCaption", "THE STUDIO FLOOR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-stone-800/50 bg-[#0c0b09] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(244,114,182,0.06),transparent_55%)]" />

        <div className="relative mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center sm:mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-200/80">
              Testimonials
            </p>
            <h2 className="mt-4 font-heading text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-tight tracking-tight text-stone-100">
              {sectionHeadline}
            </h2>
            <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
            {hasTestimonials ? (
              <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-stone-500 sm:text-base">
                Honest words from guests who’ve sat in our chairs — we’re
                grateful for every one.
              </p>
            ) : null}
          </div>

          {hasTestimonials ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {testimonials.map((t, ti) => {
                const starLevel = orderToStarLevel(t.order);
                return (
                  <article
                    key={t.key ?? `${ti}-${t.name}`}
                    className="surface-panel flex h-full flex-col rounded-2xl border border-stone-800/60 p-6 sm:p-8"
                  >
                    <div
                      className="mb-5 flex gap-0.5 text-amber-200/80"
                      aria-hidden
                      title={`Priority ${starLevel} of 5`}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`size-4 shrink-0 ${
                            n <= starLevel
                              ? "fill-amber-200/90 text-amber-200/90"
                              : "fill-none text-stone-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="min-h-0 flex-1 text-base italic leading-relaxed text-stone-200 sm:text-lg">
                      “{t.quote}”
                    </p>
                    <div className="mt-6 flex items-center gap-4 pt-2">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-stone-700/50 bg-gradient-to-br from-stone-800/90 to-stone-950 font-heading text-sm font-semibold tracking-tight text-amber-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        aria-hidden
                      >
                        {initialsFromName(t.name)}
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="block font-heading text-sm font-semibold text-stone-100 sm:text-base">
                          {t.name}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="surface-panel mx-auto max-w-xl rounded-2xl border border-stone-800/60 px-6 py-14 text-center sm:px-10">
              <p className="text-sm leading-relaxed text-stone-500 sm:text-base">
                Client stories will show up here once they’re added in the admin
                panel. Check back soon—or book a visit and yours might be next.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-stone-800/60 bg-[#0a0908] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(244,114,182,0.08),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(253,230,138,0.04),transparent_40%)]" />

        <div className="relative mx-auto max-w-screen-lg px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-stone-800/60 bg-[#0c0b09]/90 p-10 text-center shadow-[0_40px_100px_-48px_rgba(0,0,0,0.85)] sm:p-14 lg:p-16">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
              {showCtaBg ? (
                <Image
                  src={ctaBg}
                  alt={settings?.aboutCtaBackgroundImageAlt || ""}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              ) : (
                <div className="relative h-full min-h-[12rem] w-full">
                  <NoImage
                    fill
                    tone="stone"
                    className="rounded-[2rem] border-stone-800/40"
                  />
                </div>
              )}
            </div>
            <div className="relative">
              <h2 className="font-heading text-2xl font-semibold leading-snug tracking-tight text-stone-100 sm:text-4xl sm:leading-snug">
                {txt(settings, "aboutCtaHeadline", "Ready for a fresh chapter?")}
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-stone-500 sm:text-lg">
                {txt(
                  settings,
                  "aboutCtaBody",
                  "Book a consultation or your next appointment — we’ll make a plan that fits your hair and your life.",
                )}
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                <HeroCtaLink
                  href={txt(settings, "aboutCtaButtonHref", "/book-a-service")}
                  className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-stone-100 px-10 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-stone-950 transition hover:bg-amber-50"
                >
                  {txt(settings, "aboutCtaButtonLabel", "Book your visit")}
                </HeroCtaLink>
                <HeroCtaLink
                  href="/contact"
                  className="inline-flex min-w-[200px] items-center justify-center rounded-full border border-stone-600/90 px-10 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-stone-200 transition hover:border-stone-500 hover:bg-white/[0.03]"
                >
                  Contact us
                </HeroCtaLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
