import { ImageOff } from "lucide-react";

const TONE = {
  stone:
    "border-stone-700/50 bg-stone-900/55 text-stone-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  zinc: "border-white/10 bg-white/[0.04] text-zinc-400",
  store: "border-stone-700/60 bg-[#0c0b09]/95 text-stone-500",
  slate: "border-slate-200 bg-slate-100 text-slate-400",
};

/**
 * Unified placeholder when a card or media area has no usable image.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {string} [props.label="No image"]
 * @param {boolean} [props.fill] — `absolute inset-0` inside a `relative` parent
 * @param {"stone"|"zinc"|"store"|"slate"} [props.tone="stone"] — border/text to match the surface
 * @param {"default"|"compact"|"thumbnail"} [props.size="default"] — thumbnail: tiny tiles (cart, search)
 */
export default function NoImage({
  className = "",
  label = "No image",
  fill = false,
  tone = "stone",
  size = "default",
}) {
  const t = TONE[tone] || TONE.stone;
  const position = fill ? "absolute inset-0 z-0 min-h-0 min-w-0" : "";

  if (size === "thumbnail") {
    return (
      <div
        role="img"
        aria-label={label}
        title={label}
        className={[
          "flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden px-1 text-center",
          t,
          "border",
          position,
          className,
        ].join(" ")}
      >
        <ImageOff
          className="size-3.5 shrink-0 text-current opacity-75"
          aria-hidden
        />
        <span className="max-w-full truncate text-[6px] font-semibold uppercase leading-tight tracking-[0.12em]">
          {label}
        </span>
      </div>
    );
  }

  if (size === "compact") {
    return (
      <div
        role="img"
        aria-label={label}
        className={[
          "flex flex-col items-center justify-center gap-1.5 px-3 py-4 text-center",
          t,
          "border",
          position,
          className,
        ].join(" ")}
      >
        <ImageOff
          className="size-6 shrink-0 text-current opacity-70"
          aria-hidden
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
          {label}
        </p>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={[
        "flex flex-col items-center justify-center gap-2 p-4 text-center",
        t,
        "border",
        fill ? "" : "rounded-lg",
        position,
        className,
      ].join(" ")}
    >
      <ImageOff
        className="size-8 shrink-0 text-current opacity-60"
        aria-hidden
      />
      <p className="text-xs font-semibold uppercase tracking-[0.25em]">
        {label}
      </p>
    </div>
  );
}
