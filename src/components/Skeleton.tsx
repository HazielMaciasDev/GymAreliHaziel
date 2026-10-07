export function ExerciseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-fog bg-paper">
      <div className="relative aspect-[4/3] animate-pulse bg-fog" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-fog" />
        <div className="h-5 w-1/3 animate-pulse rounded-pill bg-fog" />
      </div>
    </div>
  );
}

export function ExerciseBankSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="h-3 w-12 animate-pulse rounded bg-fog" />
            <div className="mt-2 h-7 w-32 animate-pulse rounded bg-fog" />
          </div>
          <div className="h-6 w-16 animate-pulse rounded-pill bg-fog" />
        </div>
        <div className="h-11 w-full animate-pulse rounded-card bg-fog" />
      </div>
      <div className="flex gap-2 overflow-hidden pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-20 flex-shrink-0 animate-pulse rounded-pill bg-fog"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <ExerciseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function BannerOffline({ onReload }: { onReload?: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-card border border-linen-mist bg-linen-mist/40 px-4 py-2 text-[12px] text-forest-ink">
      <span className="font-medium">
        Modo sin conexión · mostrando banco local
      </span>
      {onReload ? (
        <button
          type="button"
          onClick={onReload}
          className="rounded-pill bg-forest-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-lime-voltage transition hover:bg-spruce"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}