import Link from "next/link";
import { STUDIO } from "@/config/studio";
import { capitalize, formatDayLong, formatTime } from "@/lib/format";
import type { AvailableSlot } from "@/types";

// Biglietto di conferma (DESIGN.md, "Componenti chiave"): ricorda il
// cartoncino che lo studio consegna al cliente, con la linea da strappare.
export function BookingTicket({ slot }: { slot: AvailableSlot }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-[var(--color-muted)]">Prenotazione confermata</p>
        <h1 className="mt-1 font-display text-[34px] leading-[1.1] text-[var(--color-ink)] sm:text-[40px]">
          Ti aspettiamo.
        </h1>
      </div>

      <div className="animate-settle relative max-w-md rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="px-6 pb-5 pt-6">
          <p className="font-display text-[28px] leading-tight text-[var(--color-ink)]">
            {capitalize(formatDayLong(slot.slotStart))}
          </p>
          <p className="mt-1 font-figures text-[44px] font-bold leading-none tracking-tight text-[var(--color-accent)]">
            {formatTime(slot.slotStart)}
          </p>
          <p className="mt-3 text-[16px] text-[var(--color-muted)]">
            {slot.appointmentTypeName} · {slot.durationMinutes} minuti
          </p>
        </div>

        {/* Linea da strappare, con le due mezzelune ai lati. */}
        <div aria-hidden className="relative mx-4 border-t-2 border-dashed border-[var(--color-line)]">
          <span className="absolute -left-[27px] -top-[11px] h-5 w-5 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] [clip-path:inset(0_0_0_50%)]" />
          <span className="absolute -right-[27px] -top-[11px] h-5 w-5 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] [clip-path:inset(0_50%_0_0)]" />
        </div>

        <div className="flex flex-col gap-1 px-6 pb-6 pt-4 text-[15px] text-[var(--color-muted)]">
          <p className="font-semibold text-[var(--color-ink)]">{STUDIO.name}</p>
          <p>Puoi chiedere di spostarlo fino a 24 ore prima, da &ldquo;I miei appuntamenti&rdquo;.</p>
          <p>Per annullarlo, contatta lo studio.</p>
        </div>
      </div>

      <Link
        href="/portale/i-miei-appuntamenti"
        className="inline-flex min-h-[44px] max-w-md items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-[16px] font-semibold text-[var(--color-ink)] hover:border-[var(--color-ink)]"
      >
        Vai a I miei appuntamenti
      </Link>
    </div>
  );
}
