import { BookingCalendar } from "@/components/portale/BookingCalendar";

export default function PrenotaPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
        Prenota un appuntamento
      </h1>
      <p className="mb-4 text-[15px] text-[var(--color-muted)]">
        Scegli un orario libero: la prenotazione viene confermata subito.
      </p>
      <BookingCalendar />
    </div>
  );
}
