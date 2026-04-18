/** Shared classes for login, register, forgot/reset password (matches Contact / site shell). */

export const authInputClass =
  "w-full rounded-xl border border-stone-700/50 bg-white/[0.04] px-4 py-3.5 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-500/35 focus:ring-2 focus:ring-amber-500/20";

export const authCardClass =
  "rounded-2xl border border-stone-800/60 bg-[#0c0b09]/90 p-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl ring-1 ring-white/[0.04] sm:p-10";

export const authPrimaryButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-100 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-950 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60";

/** Outline actions (Back), cart secondary CTAs */
export const storeSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-stone-600/80 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-200 transition hover:border-stone-500 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50";

/** Cart / checkout summary panels */
export const storePanelClass =
  "rounded-2xl border border-stone-800/60 bg-[#0c0b09]/90 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.04] backdrop-blur-xl";
