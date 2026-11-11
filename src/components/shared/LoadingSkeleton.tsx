// Segnaposto mostrato subito al cambio pagina, mentre il server prepara i
// dati (src/app/(studio)/loading.tsx e src/app/portale/(area)/loading.tsx).
// Pulsazione lenta e leggera, spenta se il dispositivo chiede meno movimento.

function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-[var(--color-line)]/60 motion-safe:animate-pulse ${className}`}
    />
  );
}

export function StudioPageSkeleton() {
  return (
    <div role="status" aria-label="Caricamento" className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Block className="h-7 w-48" />
        <Block className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <Block className="h-3.5 w-24" />
            <Block className="mt-3 h-7 w-10" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <Block className="h-4 w-32" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mt-4 flex items-center gap-4">
            <Block className="h-4 w-14" />
            <Block className="h-4 flex-1" />
          </div>
        ))}
      </div>
      <span className="sr-only">Caricamento…</span>
    </div>
  );
}

export function PortalePageSkeleton() {
  return (
    <div role="status" aria-label="Caricamento" className="flex flex-col gap-6">
      <div className="rounded-xl bg-[var(--color-salvia)] px-5 py-5 sm:px-6">
        <Block className="h-3.5 w-36 bg-[var(--color-surface)]/60" />
        <Block className="mt-3 h-8 w-64 bg-[var(--color-surface)]/60" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Block key={i} className="h-11" />
        ))}
      </div>
      <span className="sr-only">Caricamento…</span>
    </div>
  );
}
