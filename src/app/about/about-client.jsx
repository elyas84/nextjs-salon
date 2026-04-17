"use client";

import Image from "next/image";
import SiteHeroSection from "@/components/kinetic/site-hero-section";
import NoImage from "@/components/ui/NoImage";
import HeroCtaLink from "@/components/kinetic/hero-cta-link";
import { isUsableImageUrl } from "@/lib/site-hero";
import {
  initialsFromName,
  orderToStarLevel,
} from "@/lib/testimonial-initials";
import { ArrowRight, ChevronRight, Star } from "lucide-react";

const DEFAULT_TEAM = [
  { name: "Avery Kim", role: "Lead stylist / Color director" },
  { name: "Jordan Ellis", role: "Senior stylist" },
  { name: "Sam Rivera", role: "Treatment & extension specialist" },
];

function txt(s, key, fallback) {
  const v = String(s?.[key] ?? "").trim();
  return v || fallback;
}

function resolveTeam(teamData, settings) {
  const fromApi = teamData?.team;
  if (Array.isArray(fromApi) && fromApi.length > 0) {
    return fromApi.map((m) => ({
      id: m.id,
      name: String(m.name || "—").trim() || "—",
      role: String(m.role || "—").trim() || "—",
      imageUrl: String(m.imageUrl || "").trim(),
      imageAlt: String(m.imageAlt || m.name || "Team member").trim(),
    }));
  }
  const legacy = settings?.teamMembers;
  if (Array.isArray(legacy) && legacy.length > 0) {
    return legacy.map((m, i) => ({
      id: `legacy-${i}`,
      name: String(m.name || "—").trim() || "—",
      role: String(m.role || "—").trim() || "—",
      imageUrl: String(m.imageUrl || "").trim(),
      imageAlt: String(m.imageAlt || m.name || "Team member").trim(),
    }));
  }
  return DEFAULT_TEAM.map((m, i) => ({
    id: `default-${i}`,
    ...m,
    imageUrl: "",
    imageAlt: m.name,
  }));
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
  teamData = null,
}) {
  const team = resolveTeam(teamData, settings);
  const heritage = String(settings?.aboutHeritageImageUrl || "").trim();
  const ctaBg = String(settings?.aboutCtaBackgroundImageUrl || "").trim();
  const showHeritage = heritage && isUsableImageUrl(heritage);
  const showCtaBg = ctaBg && isUsableImageUrl(ctaBg);

  const { sectionHeadline, items: testimonials, hasTestimonials } =
    resolveTestimonials(testimonialsData);

  return (
    <main className="pt-10">
      <SiteHeroSection settings={settings} variant="about" />

      <section className="bg-zinc-950 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 md:col-span-7 md:p-12">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                {txt(settings, "aboutHeritageHeadline", "OUR HERITAGE")}
              </h2>
              <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-zinc-300">
                {txt(
                  settings,
                  "aboutHeritageBody",
                  "Studio Salon began as a small chair-and-mirror studio and grew into a neighborhood destination for thoughtful hair and beauty. We still believe the best results start with listening — then cut, color, and finish with care.",
                )}
              </p>

              <div className="mt-10 grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                <div>
                  <span className="block font-heading text-4xl font-black text-rose-300">
                    {txt(settings, "aboutHeritageStat1Value", "25+")}
                  </span>
                  <span className="mt-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    {txt(settings, "aboutHeritageStat1Label", "Years in the chair")}
                  </span>
                </div>
                <div>
                  <span className="block font-heading text-4xl font-black text-rose-300">
                    {txt(settings, "aboutHeritageStat2Value", "12k+")}
                  </span>
                  <span className="mt-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    {txt(settings, "aboutHeritageStat2Label", "Guests styled")}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 md:col-span-5">
              {showHeritage ? (
                <div className="relative h-full min-h-80 w-full">
                  <Image
                    src={heritage}
                    alt={settings?.aboutHeritageImageAlt || "Heritage"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                </div>
              ) : (
                <NoImage label="No image" className="h-full min-h-80 w-full" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-60" />
              <div className="absolute bottom-8 left-8">
                <span className="font-heading text-2xl font-bold text-zinc-50">
                  {txt(settings, "aboutHeritageImageCaption", "THE STUDIO FLOOR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <div className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-heading text-4xl font-black uppercase tracking-tight text-zinc-50 sm:text-5xl">
                {txt(settings, "aboutEngineersHeadline", "THE TEAM")}
              </h2>
              <p className="mt-4 text-lg text-zinc-300">
                {txt(
                  settings,
                  "aboutEngineersIntro",
                  "Stylists and specialists who train continuously — so your cut, color, and care stay current.",
                )}
              </p>
            </div>
            <HeroCtaLink
              href={txt(settings, "aboutEngineersCtaHref", "/services")}
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-rose-300 transition-colors hover:text-rose-200"
            >
              {txt(settings, "aboutEngineersCtaLabel", "Explore services")}{" "}
              <ArrowRight className="size-4" />
            </HeroCtaLink>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {team.map((m, i) => (
              <div
                key={m.id ?? `team-${i}-${String(m.name)}`}
                className="group flex h-full min-h-0 min-w-0 w-full flex-col"
              >
                <div className="relative h-44 w-full min-h-0 shrink-0 overflow-hidden sm:h-48 md:h-52">
                  {m.imageUrl ? (
                    <Image
                      src={m.imageUrl}
                      alt={m.imageAlt || m.name}
                      loading="eager"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition duration-500 ease-out group-hover:scale-[1.02]"
                    />
                  ) : (
                    <NoImage
                      label="No image"
                      className="h-full w-full rounded-none border-0"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/10 to-transparent" />
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 text-left sm:px-5 sm:pb-5 sm:pt-4">
                  <h3 className="font-heading text-base font-bold leading-snug tracking-tight text-zinc-50 sm:text-lg">
                    {m.name}
                  </h3>
                  <p className="mt-2 text-[10px] font-semibold uppercase leading-relaxed tracking-widest text-rose-300/95 sm:text-xs">
                    {m.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="border-y border-white/[0.04] bg-zinc-950/25 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="font-heading text-4xl font-black uppercase tracking-tight text-zinc-50 sm:text-5xl">
              {sectionHeadline}
            </h2>
            <div className="mx-auto mt-6 h-1 w-24 bg-rose-500" />
            {hasTestimonials ? (
              <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                Honest words from guests who’ve sat in our chairs — we’re
                grateful for every one.
              </p>
            ) : null}
          </div>

          {hasTestimonials ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, ti) => {
                const starLevel = orderToStarLevel(t.order);
                return (
                <article
                  key={t.key ?? `${ti}-${t.name}`}
                  className="group flex h-full flex-col rounded-xl bg-gradient-to-b from-white/[0.05] to-transparent p-6 sm:p-8"
                >
                  <div
                    className="mb-5 flex gap-0.5 text-rose-400/90"
                    aria-hidden
                    title={`Priority ${starLevel} of 5`}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`size-4 shrink-0 ${
                          n <= starLevel
                            ? "fill-rose-400 text-rose-400"
                            : "fill-none text-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="min-h-0 flex-1 text-base italic leading-relaxed text-zinc-100 sm:text-lg">
                    “{t.quote}”
                  </p>
                  <div className="mt-6 flex items-center gap-4 pt-2">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-zinc-900 font-heading text-sm font-bold tracking-tight text-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      aria-hidden
                    >
                      {initialsFromName(t.name)}
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="block font-heading text-sm font-bold text-zinc-50 sm:text-base">
                        {t.name}
                      </span>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center sm:px-10">
              <p className="text-base leading-relaxed text-zinc-400 sm:text-lg">
                Client stories will show up here once they’re added in the admin
                panel. Check back soon—or book a visit and yours might be next.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-screen-xl">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-10 text-center sm:p-14 lg:p-16">
            <div className="pointer-events-none absolute inset-0 opacity-10">
              {showCtaBg ? (
                <Image
                  src={ctaBg}
                  alt={settings?.aboutCtaBackgroundImageAlt || ""}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              ) : (
                <NoImage label="No image" className="h-full w-full rounded-none" />
              )}
            </div>
            <div className="relative">
              <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-zinc-950 sm:text-5xl">
                {txt(settings, "aboutCtaHeadline", "Ready for a fresh chapter?")}
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base font-medium text-zinc-900/80 sm:text-xl">
                {txt(
                  settings,
                  "aboutCtaBody",
                  "Book a consultation or your next appointment — we’ll make a plan that fits your hair and your life.",
                )}
              </p>
              <HeroCtaLink
                href={txt(settings, "aboutCtaButtonHref", "/book-a-service")}
                className="mt-10 inline-flex items-center justify-center rounded-md bg-zinc-950 px-10 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl transition hover:bg-zinc-900"
              >
                {txt(settings, "aboutCtaButtonLabel", "Book your visit")}{" "}
                <ChevronRight className="ml-2 size-4" />
              </HeroCtaLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
