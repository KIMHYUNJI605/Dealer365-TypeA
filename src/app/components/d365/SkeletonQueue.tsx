export function SkeletonQueue({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 animate-pulse"
        >
          <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-40" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-56" />
            <div className="flex gap-2 mt-2">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
            </div>
          </div>
          <div className="space-y-2 items-end flex flex-col shrink-0">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
