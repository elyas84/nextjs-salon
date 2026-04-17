"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { isLikelyGalleryPageUrl } from "@/lib/site-hero";
import { SITE_SETTINGS_STRING_LIMITS } from "@/lib/site-settings-string-limits";

function buildSiteSettingsSaveBody(draft) {
  const body = {};
  for (const key of Object.keys(SITE_SETTINGS_STRING_LIMITS)) {
    body[key] = draft[key] ?? "";
  }
  return body;
}

function SiteSettingsSaveButton({ onClick, saving, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || saving}
      className="kinetic-gradient inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-950 shadow-lg shadow-black/25 transition hover:brightness-110 disabled:opacity-50"
    >
      {saving ? <Loader2 className="size-4 animate-spin" /> : null}
      Save changes
    </button>
  );
}

/** Jump targets for the settings quick menu (smooth scroll). */
const SITE_SETTINGS_SECTIONS = [
  { id: "site-settings-home", label: "Home page" },
  { id: "site-settings-services", label: "Services page" },
  { id: "site-settings-about", label: "About · Hero" },
  {
    id: "site-settings-about-heritage",
    label: "About · Heritage",
  },
];

/** Viewport line (px from top) — section is “current” once its top passes this (below admin header + sticky strip). */
const SETTINGS_NAV_ANCHOR_PX = 168;

function computeActiveSettingsSectionId() {
  const ids = SITE_SETTINGS_SECTIONS.map((s) => s.id);
  let active = ids[0];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top;
    if (top <= SETTINGS_NAV_ANCHOR_PX) {
      active = id;
    }
  }
  const nearBottom =
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 48;
  if (nearBottom) {
    active = ids[ids.length - 1];
  }
  return active;
}

function SettingsTextField({
  draft,
  setDraft,
  fieldKey,
  label,
  multiline,
  rows = 3,
  placeholder,
  wide,
}) {
  const inputClass =
    "w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/30";
  const v = draft[fieldKey] || "";
  const on = (x) =>
    setDraft((d) => (d ? { ...d, [fieldKey]: x } : d));
  const wrap = wide ? "block sm:col-span-2" : "block";
  const spanClass =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-zinc-500";
  if (multiline) {
    return (
      <label className={`${wrap}`}>
        <span className={spanClass}>{label}</span>
        <textarea
          rows={rows}
          value={v}
          onChange={(e) => on(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} resize-y`}
        />
      </label>
    );
  }
  return (
    <label className={wrap}>
      <span className={spanClass}>{label}</span>
      <input
        value={v}
        onChange={(e) => on(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function ImageFieldGroup({
  title,
  urlKey,
  altKey,
  label,
  urlHelp,
  altFieldLabel = "Alt text",
  warnGalleryPageUrl,
  draft,
  setDraft,
  uploadingKey,
  setUploadingKey,
}) {
  const uploadId = `upload-${urlKey}`;
  const isBusy = uploadingKey === urlKey;
  const rawUrl = draft?.[urlKey] || "";
  const showGalleryWarning =
    Boolean(warnGalleryPageUrl) && isLikelyGalleryPageUrl(rawUrl);

  const setUrl = (v) =>
    setDraft((d) => (d ? { ...d, [urlKey]: v } : d));
  const setAlt = (v) =>
    setDraft((d) => (d ? { ...d, [altKey]: v } : d));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingKey(urlKey);
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("uploadType", "gallery");
      const res = await fetch("/api/uploads", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Upload failed.");
        return;
      }
      const urls = Array.isArray(data.files)
        ? data.files.map((x) => x?.url).filter(Boolean)
        : [];
      if (urls[0]) {
        setUrl(urls[0]);
        toast.success("Image uploaded.");
      }
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-200">{label}</p>
      {urlHelp ? (
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">{urlHelp}</p>
      ) : null}
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
          Image URL
        </span>
        <input
          value={rawUrl}
          onChange={(e) => setUrl(e.target.value)}
          className={`w-full rounded-xl border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/30 ${
            showGalleryWarning
              ? "border-amber-500/50"
              : "border-white/10"
          }`}
          placeholder="https://…"
        />
      </label>
      {showGalleryWarning ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
          This looks like a photo <strong className="font-semibold">page</strong> (HTML), not a
          direct image file. Use <strong className="font-semibold">Upload</strong>, or open the
          image on the stock site, choose &quot;Copy image address&quot; / download link, and paste
          a URL that points to a .jpg, .webp, or similar file (often{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
            images.pexels.com
          </code>{" "}
          for Pexels).
        </p>
      ) : null}
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
          {altFieldLabel}
        </span>
        <input
          value={draft?.[altKey] || ""}
          onChange={(e) => setAlt(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/30"
        />
      </label>
      <div className="mt-3">
        <input
          id={uploadId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onFile}
        />
        <label
          htmlFor={uploadId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:bg-white/10"
        >
          {isBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Upload
        </label>
      </div>
    </div>
  );
}

export default function SiteSettingsPanel({ active }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [activeSettingsNavId, setActiveSettingsNavId] = useState(
    SITE_SETTINGS_SECTIONS[0].id,
  );
  const settingsNavScrollRaf = useRef(0);

  const goToSettingsSection = useCallback((sectionId) => {
    setActiveSettingsNavId(sectionId);
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/site-settings", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to load settings.");
        return;
      }
      const s = data.settings;
      if (s) {
        setDraft({ ...s });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    load();
  }, [active, load]);

  useEffect(() => {
    if (!active || !draft) return;

    const runSync = () => {
      setActiveSettingsNavId(computeActiveSettingsSectionId());
    };

    const onScrollOrResize = () => {
      if (settingsNavScrollRaf.current) return;
      settingsNavScrollRaf.current = requestAnimationFrame(() => {
        settingsNavScrollRaf.current = 0;
        runSync();
      });
    };

    runSync();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (settingsNavScrollRaf.current) {
        cancelAnimationFrame(settingsNavScrollRaf.current);
        settingsNavScrollRaf.current = 0;
      }
    };
  }, [active, draft]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSiteSettingsSaveBody(draft)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("You don’t have permission to save site settings.");
        } else {
          toast.error(data.error || "Save failed.");
        }
        return;
      }
      if (data.settings) setDraft({ ...data.settings });
      toast.success("Settings saved.");
    } finally {
      setSaving(false);
    }
  };

  if (!active) return null;

  if (loading && !draft) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="size-5 animate-spin" />
        Loading settings…
      </div>
    );
  }

  if (!draft) {
    return (
      <p className="text-sm text-zinc-500">
        Could not load settings. Refresh or try again.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* top-20 (5rem): when this bar sticks, it sits below the h-16 header with breathing room — no extra offset while still in normal flow */}
      <div className="sticky top-20 z-30 -mx-4 border-b border-white/10 bg-zinc-950/90 px-4 py-3 shadow-[0_6px_20px_-4px_rgba(0,0,0,0.45)] backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-xs text-zinc-400 sm:text-sm">
            <span className="text-zinc-300">
              Save stays here while you scroll.
            </span>{" "}
            Upload or paste direct image URLs.{" "}
            <span className="text-orange-200/90">
              Nothing is live until you save.
            </span>
          </p>
          <SiteSettingsSaveButton onClick={save} saving={saving} />
        </div>
        <nav
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3"
          aria-label="Jump to section"
        >
          <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Go to
          </span>
          {SITE_SETTINGS_SECTIONS.map((s) => {
            const isActive = activeSettingsNavId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-current={isActive ? "true" : undefined}
                onClick={() => goToSettingsSection(s.id)}
                className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                  isActive
                    ? "border-orange-500/70 bg-orange-500/15 text-orange-100 shadow-[0_0_0_1px_rgba(249,115,22,0.25)]"
                    : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-200"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        id="site-settings-home"
        className="scroll-mt-36"
      >
        <h3 className="text-xs font-black uppercase tracking-widest text-orange-300/90">
          Home page
        </h3>
        <p className="mt-2 text-xs text-zinc-500">
          Hero and Precision Tuning grid for <span className="text-zinc-300">/</span>{" "}
          only — independent from the services page.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Home page
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              Hero — copy & calls to action
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Empty fields use built-in defaults on the live site.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="homeHeroBadgeText"
                label="Eyebrow / badge (small pill above the headline)"
                wide
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="homeHeroTitleLine1"
                label="Headline — main line (large, light text)"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="homeHeroTitleLine2"
                label="Headline — accent line (gradient emphasis)"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="homeHeroDescription"
                label="Supporting copy"
                multiline
                wide
                rows={4}
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="homeHeroPrimaryCtaLabel"
                label="Primary CTA — button text"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="homeHeroPrimaryCtaHref"
                label="Primary CTA — link"
                placeholder="/book-a-service"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="homeHeroSecondaryCtaLabel"
                label="Secondary CTA — button text"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="homeHeroSecondaryCtaHref"
                label="Secondary CTA — link"
                placeholder="/products"
              />
            </div>
          </div>

          <ImageFieldGroup
            title="Home page"
            label="Hero background image — full width behind the headline."
            urlHelp="The address bar link from a stock site is usually a gallery page and will not show here. Use Upload, or paste a direct file URL (often contains images.pexels.com, .jpg, or .webp)."
            altFieldLabel="Image description (accessibility)"
            warnGalleryPageUrl
            urlKey="homeHeroImageUrl"
            altKey="homeHeroImageAlt"
            draft={draft}
            setDraft={setDraft}
            uploadingKey={uploadingKey}
            setUploadingKey={setUploadingKey}
          />

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Home page
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">
                Precision Tuning — section header
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Same as the hero: empty copy fields use built-in defaults. Each
                card can use a direct image URL or Upload (no stock gallery
                page links). Click Save changes when done.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesEyebrow"
                  label="Eyebrow (e.g. Our Expertise)"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesHeadline"
                  label="Headline (e.g. PRECISION TUNING)"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesIntro"
                  label="Intro blurb (right column on desktop)"
                  multiline
                  wide
                  rows={4}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-300/80">
                Card 1 — wide (e.g. Engine Diagnostics)
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC1Title"
                  label="Title"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC1CtaLabel"
                  label="Link label"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC1CtaHref"
                  label="Link URL"
                  placeholder="/services"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC1Body"
                  label="Body"
                  multiline
                  wide
                  rows={3}
                />
              </div>
            </div>
            <ImageFieldGroup
              title="Home · Card 1"
              label="Background image — full bleed behind title and copy (wide card)."
              urlHelp="Direct image file URL or upload — same rules as the hero background."
              altFieldLabel="Image description (accessibility)"
              warnGalleryPageUrl
              urlKey="homeKeyServicesC1ImageUrl"
              altKey="homeKeyServicesC1ImageAlt"
              draft={draft}
              setDraft={setDraft}
              uploadingKey={uploadingKey}
              setUploadingKey={setUploadingKey}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-300/80">
                Card 2 — narrow (e.g. fluid exchange + price)
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC2IconLabel"
                  label="Icon / badge text (short)"
                  placeholder="OIL"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC2Title"
                  label="Title"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC2PriceLabel"
                  label="Price line label"
                  placeholder="Starting from"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC2Price"
                  label="Price display"
                  placeholder="$199.00"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC2Body"
                  label="Body"
                  multiline
                  wide
                  rows={3}
                />
              </div>
            </div>
            <ImageFieldGroup
              title="Home · Card 2"
              label="Background image — fills the narrow card behind content."
              urlHelp="Direct image file URL or upload — same rules as the hero background."
              altFieldLabel="Image description (accessibility)"
              warnGalleryPageUrl
              urlKey="homeKeyServicesC2ImageUrl"
              altKey="homeKeyServicesC2ImageAlt"
              draft={draft}
              setDraft={setDraft}
              uploadingKey={uploadingKey}
              setUploadingKey={setUploadingKey}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-300/80">
                Card 3 — narrow (e.g. braking)
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Optional link: set both label and URL, or leave both empty to
                show the + accent only.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC3Title"
                  label="Title"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC3CtaLabel"
                  label="Link label (optional)"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC3CtaHref"
                  label="Link URL (optional)"
                  placeholder="/services"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC3Body"
                  label="Body"
                  multiline
                  wide
                  rows={3}
                />
              </div>
            </div>
            <ImageFieldGroup
              title="Home · Card 3"
              label="Background image — full bleed (e.g. brakes / wheel photo)."
              urlHelp="Direct image file URL or upload — same rules as the hero background."
              altFieldLabel="Image description (accessibility)"
              warnGalleryPageUrl
              urlKey="homeKeyServicesC3ImageUrl"
              altKey="homeKeyServicesC3ImageAlt"
              draft={draft}
              setDraft={setDraft}
              uploadingKey={uploadingKey}
              setUploadingKey={setUploadingKey}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-300/80">
                Card 4 — wide (copy + side image)
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC4Title"
                  label="Title"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC4CtaLabel"
                  label="Button label"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC4CtaHref"
                  label="Button link"
                  placeholder="/products"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="homeKeyServicesC4Body"
                  label="Body"
                  multiline
                  wide
                  rows={3}
                />
              </div>
            </div>
            <ImageFieldGroup
              title="Home · Card 4"
              label="Side image — right column on the wide card (all breakpoints)."
              urlHelp="Direct image file URL or upload — same rules as the hero background."
              altFieldLabel="Image description (accessibility)"
              warnGalleryPageUrl
              urlKey="homeKeyServicesC4ImageUrl"
              altKey="homeKeyServicesC4ImageAlt"
              draft={draft}
              setDraft={setDraft}
              uploadingKey={uploadingKey}
              setUploadingKey={setUploadingKey}
            />
          </div>
        </div>
      </div>

      <div
        id="site-settings-services"
        className="scroll-mt-36"
      >
        <h3 className="text-xs font-black uppercase tracking-widest text-orange-300/90">
          Services page
        </h3>
        <p className="mt-2 text-xs text-zinc-500">
          Hero and Precision Tuning grid for{" "}
          <span className="text-zinc-300">/services</span> — separate from the home
          page. Standard banner is only on services.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Services page
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              Hero — copy & calls to action
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Empty fields use built-in defaults on the live site.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesHeroBadgeText"
                label="Eyebrow / badge (small pill above the headline)"
                wide
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesHeroTitleLine1"
                label="Headline — main line (large, light text)"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesHeroTitleLine2"
                label="Headline — accent line (gradient emphasis)"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesHeroDescription"
                label="Supporting copy"
                multiline
                wide
                rows={4}
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesHeroPrimaryCtaLabel"
                label="Primary CTA — button text"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesHeroPrimaryCtaHref"
                label="Primary CTA — link"
                placeholder="/book-a-service"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesHeroSecondaryCtaLabel"
                label="Secondary CTA — button text"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesHeroSecondaryCtaHref"
                label="Secondary CTA — link"
                placeholder="/contact"
              />
            </div>
          </div>

          <ImageFieldGroup
            title="Services page"
            label="Hero background image — full width behind the headline."
            urlHelp="The address bar link from a stock site is usually a gallery page and will not show here. Use Upload, or paste a direct file URL (often contains images.pexels.com, .jpg, or .webp)."
            altFieldLabel="Image description (accessibility)"
            warnGalleryPageUrl
            urlKey="servicesHeroImageUrl"
            altKey="servicesHeroImageAlt"
            draft={draft}
            setDraft={setDraft}
            uploadingKey={uploadingKey}
            setUploadingKey={setUploadingKey}
          />

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Services page
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">
                Precision Tuning — section header
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Same as the hero: empty copy fields use built-in defaults. Each
                card can use a direct image URL or Upload (no stock gallery page
                links).
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesEyebrow"
                  label="Eyebrow (e.g. Our Expertise)"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesHeadline"
                  label="Headline (e.g. PRECISION TUNING)"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesIntro"
                  label="Intro blurb (right column on desktop)"
                  multiline
                  wide
                  rows={4}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-300/80">
                Card 1 — wide (e.g. Engine Diagnostics)
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC1Title"
                  label="Title"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC1CtaLabel"
                  label="Link label"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC1CtaHref"
                  label="Link URL"
                  placeholder="/services"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC1Body"
                  label="Body"
                  multiline
                  wide
                  rows={3}
                />
              </div>
            </div>
            <ImageFieldGroup
              title="Services · Card 1"
              label="Background image — full bleed behind title and copy (wide card)."
              urlHelp="Direct image file URL or upload — same rules as the hero background."
              altFieldLabel="Image description (accessibility)"
              warnGalleryPageUrl
              urlKey="servicesKeyServicesC1ImageUrl"
              altKey="servicesKeyServicesC1ImageAlt"
              draft={draft}
              setDraft={setDraft}
              uploadingKey={uploadingKey}
              setUploadingKey={setUploadingKey}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-300/80">
                Card 2 — narrow (e.g. fluid exchange + price)
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC2IconLabel"
                  label="Icon / badge text (short)"
                  placeholder="OIL"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC2Title"
                  label="Title"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC2PriceLabel"
                  label="Price line label"
                  placeholder="Starting from"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC2Price"
                  label="Price display"
                  placeholder="$199.00"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC2Body"
                  label="Body"
                  multiline
                  wide
                  rows={3}
                />
              </div>
            </div>
            <ImageFieldGroup
              title="Services · Card 2"
              label="Background image — fills the narrow card behind content."
              urlHelp="Direct image file URL or upload — same rules as the hero background."
              altFieldLabel="Image description (accessibility)"
              warnGalleryPageUrl
              urlKey="servicesKeyServicesC2ImageUrl"
              altKey="servicesKeyServicesC2ImageAlt"
              draft={draft}
              setDraft={setDraft}
              uploadingKey={uploadingKey}
              setUploadingKey={setUploadingKey}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-300/80">
                Card 3 — narrow (e.g. braking)
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Optional link: set both label and URL, or leave both empty to show
                the + accent only.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC3Title"
                  label="Title"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC3CtaLabel"
                  label="Link label (optional)"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC3CtaHref"
                  label="Link URL (optional)"
                  placeholder="/services"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC3Body"
                  label="Body"
                  multiline
                  wide
                  rows={3}
                />
              </div>
            </div>
            <ImageFieldGroup
              title="Services · Card 3"
              label="Background image — full bleed (e.g. brakes / wheel photo)."
              urlHelp="Direct image file URL or upload — same rules as the hero background."
              altFieldLabel="Image description (accessibility)"
              warnGalleryPageUrl
              urlKey="servicesKeyServicesC3ImageUrl"
              altKey="servicesKeyServicesC3ImageAlt"
              draft={draft}
              setDraft={setDraft}
              uploadingKey={uploadingKey}
              setUploadingKey={setUploadingKey}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-300/80">
                Card 4 — wide (copy + side image)
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC4Title"
                  label="Title"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC4CtaLabel"
                  label="Button label"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC4CtaHref"
                  label="Button link"
                  placeholder="/products"
                />
                <SettingsTextField
                  draft={draft}
                  setDraft={setDraft}
                  fieldKey="servicesKeyServicesC4Body"
                  label="Body"
                  multiline
                  wide
                  rows={3}
                />
              </div>
            </div>
            <ImageFieldGroup
              title="Services · Card 4"
              label="Side image — right column on the wide card (all breakpoints)."
              urlHelp="Direct image file URL or upload — same rules as the hero background."
              altFieldLabel="Image description (accessibility)"
              warnGalleryPageUrl
              urlKey="servicesKeyServicesC4ImageUrl"
              altKey="servicesKeyServicesC4ImageAlt"
              draft={draft}
              setDraft={setDraft}
              uploadingKey={uploadingKey}
              setUploadingKey={setUploadingKey}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Services page
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              Bottom “standard” banner — copy & CTAs
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Three checklist lines; leave one empty to hide that row. Watermark
              is the large faded text behind the content.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesStandardHeadline"
                label="Headline"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesStandardWatermark"
                label="Watermark text (background)"
                placeholder="FIXPRO"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesStandardBullet1"
                label="Checklist line 1"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesStandardBullet2"
                label="Checklist line 2"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesStandardBullet3"
                label="Checklist line 3"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesStandardPrimaryCtaLabel"
                label="Primary button label"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesStandardPrimaryCtaHref"
                label="Primary button link"
                placeholder="/contact"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesStandardSecondaryCtaLabel"
                label="Secondary button label"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="servicesStandardSecondaryCtaHref"
                label="Secondary button link"
                placeholder="/services"
              />
            </div>
          </div>

          <ImageFieldGroup
            title="Services page"
            label="Standard banner — optional background image (subtle, behind content)."
            urlHelp="Direct image URL or upload."
            altFieldLabel="Image description (accessibility)"
            warnGalleryPageUrl
            urlKey="servicesStandardBannerImageUrl"
            altKey="servicesStandardBannerImageAlt"
            draft={draft}
            setDraft={setDraft}
            uploadingKey={uploadingKey}
            setUploadingKey={setUploadingKey}
          />
        </div>
      </div>

      <div
        id="site-settings-about"
        className="scroll-mt-36"
      >
        <h3 className="text-xs font-black uppercase tracking-widest text-orange-300/90">
          About page
        </h3>
        <p className="mt-2 text-xs text-zinc-500">
          Same full-bleed hero layout as home/services, with its own copy. Sections
          below follow the public page top to bottom.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              About · Hero
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              Full-height banner — same structure as home
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Empty fields use the built-in About defaults on the live site.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeroBadgeText"
                label="Eyebrow / badge"
                wide
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeroTitleLine1"
                label="Headline — main line"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeroTitleLine2"
                label="Headline — accent (gradient)"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeroDescription"
                label="Supporting copy"
                multiline
                wide
                rows={4}
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeroPrimaryCtaLabel"
                label="Primary CTA — button (gradient)"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeroPrimaryCtaHref"
                label="Primary CTA — link"
                placeholder="/book-a-service"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeroSecondaryCtaLabel"
                label="Secondary CTA — button (outline)"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeroSecondaryCtaHref"
                label="Secondary CTA — link"
                placeholder="/services"
              />
            </div>
          </div>
          <ImageFieldGroup
            title="About · Hero"
            label="Background image — full width behind the headline."
            urlHelp="Direct image URL or upload. Same rules as other heroes."
            altFieldLabel="Image description (accessibility)"
            warnGalleryPageUrl
            urlKey="aboutHeroImageUrl"
            altKey="aboutHeroImageAlt"
            draft={draft}
            setDraft={setDraft}
            uploadingKey={uploadingKey}
            setUploadingKey={setUploadingKey}
          />

          <div
            id="site-settings-about-heritage"
            className="scroll-mt-36 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              About · Heritage
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              Copy & stats (two columns)
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeritageHeadline"
                label="Section headline"
                wide
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeritageBody"
                label="Body"
                multiline
                wide
                rows={5}
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeritageStat1Value"
                label="Stat 1 — value (e.g. 25+)"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeritageStat1Label"
                label="Stat 1 — label"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeritageStat2Value"
                label="Stat 2 — value (e.g. 12k+)"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutHeritageStat2Label"
                label="Stat 2 — label"
              />
            </div>
          </div>
          <ImageFieldGroup
            title="About · Heritage"
            label="Side image — next to the heritage copy."
            urlHelp="Direct image URL or upload."
            altFieldLabel="Image description (accessibility)"
            warnGalleryPageUrl
            urlKey="aboutHeritageImageUrl"
            altKey="aboutHeritageImageAlt"
            draft={draft}
            setDraft={setDraft}
            uploadingKey={uploadingKey}
            setUploadingKey={setUploadingKey}
          />
          <SettingsTextField
            draft={draft}
            setDraft={setDraft}
            fieldKey="aboutHeritageImageCaption"
            label="Caption over heritage image (bottom-left)"
            wide
          />

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              About · Engineers strip
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              Above the team grid
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutEngineersHeadline"
                label="Headline"
                wide
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutEngineersIntro"
                label="Intro"
                multiline
                wide
                rows={3}
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutEngineersCtaLabel"
                label="Link label"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutEngineersCtaHref"
                label="Link URL"
                placeholder="/services"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              About · Bottom CTA
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              Orange strip — copy & button
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutCtaHeadline"
                label="Headline"
                wide
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutCtaBody"
                label="Supporting line"
                multiline
                wide
                rows={3}
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutCtaButtonLabel"
                label="Button label"
              />
              <SettingsTextField
                draft={draft}
                setDraft={setDraft}
                fieldKey="aboutCtaButtonHref"
                label="Button link"
                placeholder="/book-a-service"
              />
            </div>
          </div>
          <ImageFieldGroup
            title="About · Bottom CTA"
            label="Optional background image (subtle, behind text)."
            urlHelp="Direct image URL or upload."
            altFieldLabel="Image description (accessibility)"
            warnGalleryPageUrl
            urlKey="aboutCtaBackgroundImageUrl"
            altKey="aboutCtaBackgroundImageAlt"
            draft={draft}
            setDraft={setDraft}
            uploadingKey={uploadingKey}
            setUploadingKey={setUploadingKey}
          />
        </div>
      </div>
    </div>
  );
}
