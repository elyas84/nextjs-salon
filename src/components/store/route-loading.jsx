import Spinner from "@/components/Spinner";

/**
 * Next.js `loading.js` — spinner only, no panel/border/shadow.
 */
export default function RouteLoading({ message = "Loading…" }) {
  return (
    <div className="flex w-full min-h-[min(420px,calc(100vh-14rem))] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Spinner size="md" />
        {message ? (
          <p className="text-sm font-medium text-slate-500">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
