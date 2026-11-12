import { PortaleNav } from "@/components/portale/layout/PortaleNav";
import { STUDIO } from "@/config/studio";

// Stessa larghezza del contenuto (max-w-3xl), così nome dello studio e menu
// restano allineati alla pagina anche su schermi larghi.
export function PortaleHeader() {
  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-[22px] pt-3 pb-1.5 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-0">
        <p className="font-display text-lg text-[var(--color-ink)]">{STUDIO.name}</p>
        <PortaleNav />
      </div>
    </header>
  );
}
