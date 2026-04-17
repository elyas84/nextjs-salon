export default function NoImage({ className = "", label = "No image" }) {
  return (
    <div
      className={[
        "flex h-full w-full items-center justify-center rounded-lg border border-white/10 bg-white/5",
        className,
      ].join(" ")}
      aria-label={label}
    >
      <div className="text-center">
        <div className="mx-auto mb-2 h-10 w-10 rounded-md border border-white/10 bg-white/5" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
          {label}
        </p>
      </div>
    </div>
  );
}

