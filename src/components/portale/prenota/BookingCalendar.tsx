"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { bookAppointmentAction } from "@/lib/actions/portale/prenota";
import {
  fetchAvailableSlots,
  fetchBookingLock,
  fetchBookingOptions,
  type SlotRow,
} from "@/lib/browser/portale";
import { capitalize, formatDateKey, formatDayLong, formatTime } from "@/lib/format";
import { addDaysToKey, romeDateKey } from "@/lib/timezone";
import type { AvailableSlot } from "@/types";
import { BookingTicket } from "./BookingTicket";

// Quanto in anticipo i clienti possono prenotare (circa due mesi).
const BOOKING_WINDOW_DAYS = 60;
// Il database restituisce al massimo 1000 righe per richiesta: scarichiamo
// gli orari a blocchi di 15 giorni per non perdere gli ultimi giorni.
const CHUNK_DAYS = 15;
// Quanti orari mostrare per gruppo (Mattina / Pomeriggio) prima di "Altri orari".
const SLOTS_PER_GROUP = 4;
// Gli orari da quest'ora in poi sono "Pomeriggio".
const AFTERNOON_FROM_HOUR = 13;

type BookingOption = { name: string; durationMinutes: number };
// Se il cliente ha già un appuntamento in programma (non ancora iniziato) non
// può prenotarne altri: gli orari li vede, ma non può sceglierli.
type BookingLock = { startsAt: string };

/** "Martedì 17 alle 10:40" */
function formatSlotSentence(slot: AvailableSlot) {
  const day = capitalize(
    formatDateKey(romeDateKey(new Date(slot.slotStart)), { weekday: "long", day: "numeric" }),
  );
  return `${day} alle ${formatTime(slot.slotStart)}`;
}

// Regole del sistema di design (DESIGN.md, "Regole del portale"): il cliente
// vede solo gli orari liberi, divisi in Mattina e Pomeriggio; scegliere un
// orario apre la conferma in una frase, e la prenotazione chiude con il biglietto.
export function BookingCalendar() {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<AvailableSlot | null>(null);
  const [options, setOptions] = useState<BookingOption[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [lock, setLock] = useState<BookingLock | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [showAllSlots, setShowAllSlots] = useState(false);

  async function loadSlots(typeName: string | null = selectedType) {
    setLoading(true);
    setError(null);
    setSelectedSlot(null);

    const today = romeDateKey();

    // Ogni blocco viene ritentato una volta se fallisce (rete o sessione
    // momentaneamente non disponibili) prima di considerarlo un errore.
    async function fetchChunk(offset: number) {
      const params = {
        p_type_name: typeName,
        p_from: addDaysToKey(today, offset),
        p_to: addDaysToKey(today, Math.min(offset + CHUNK_DAYS - 1, BOOKING_WINDOW_DAYS)),
      };
      let result = await fetchAvailableSlots(params);
      if (result.error) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        result = await fetchAvailableSlots(params);
      }
      if (result.error) console.error("get_available_slots", result.error.message);
      return result;
    }

    const offsets: number[] = [];
    for (let offset = 0; offset <= BOOKING_WINDOW_DAYS; offset += CHUNK_DAYS) offsets.push(offset);
    const results = await Promise.all(offsets.map(fetchChunk));

    setLoading(false);

    const failedCount = results.filter((r) => r.error).length;
    if (failedCount === results.length) {
      setError("Non è stato possibile caricare gli orari disponibili.");
      return;
    }

    const data = results
      .flatMap((r) => (r.data ?? []) as SlotRow[])
      .sort((x, y) => x.slot_start.localeCompare(y.slot_start));

    if (failedCount > 0) {
      setError("Alcuni giorni non sono stati caricati. Ricarica la pagina per vederli tutti.");
    }

    const mapped: AvailableSlot[] = data.map((row) => ({
      slotStart: row.slot_start,
      slotEnd: row.slot_end,
      durationMinutes: row.duration_minutes,
      appointmentTypeName: row.appointment_type_name,
    }));

    setSlots(mapped);
    // Il giorno scelto resta se ha ancora orari liberi, altrimenti il primo disponibile.
    const days = new Set(mapped.map((s) => romeDateKey(new Date(s.slotStart))));
    setSelectedDay((current) => (current && days.has(current) ? current : (mapped[0] ? romeDateKey(new Date(mapped[0].slotStart)) : null)));
  }

  useEffect(() => {
    async function init() {
      const { data: lockData } = await fetchBookingLock();
      const lockRow = (lockData ?? [])[0] as { lock_starts_at: string } | undefined;
      if (lockRow) {
        setLock({ startsAt: lockRow.lock_starts_at });
      }
      const { data } = await fetchBookingOptions();
      const loaded: BookingOption[] = (data ?? []).map(
        (row: { name: string; duration_minutes: number }) => ({
          name: row.name,
          durationMinutes: row.duration_minutes,
        }),
      );
      setOptions(loaded);
      // Il primo tipo (il più breve) è quello predefinito.
      const first = loaded[0]?.name ?? null;
      setSelectedType(first);
      await loadSlots(first);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTypeChange(typeName: string) {
    if (typeName === selectedType) return;
    setSelectedType(typeName);
    setShowAllSlots(false);
    loadSlots(typeName);
  }

  function handleDayChange(day: string) {
    setSelectedDay(day);
    setSelectedSlot(null);
    setShowAllSlots(false);
  }

  const days = useMemo(() => {
    const keys: string[] = [];
    for (const slot of slots) {
      const key = romeDateKey(new Date(slot.slotStart));
      if (keys[keys.length - 1] !== key) keys.push(key);
    }
    return keys;
  }, [slots]);

  const groups = useMemo(() => {
    const daySlots = slots.filter((s) => romeDateKey(new Date(s.slotStart)) === selectedDay);
    const isAfternoon = (s: AvailableSlot) =>
      Number(formatTime(s.slotStart).slice(0, 2)) >= AFTERNOON_FROM_HOUR;
    return [
      { title: "Mattina", slots: daySlots.filter((s) => !isAfternoon(s)) },
      { title: "Pomeriggio", slots: daySlots.filter(isAfternoon) },
    ].filter((g) => g.slots.length > 0);
  }, [slots, selectedDay]);

  const hiddenCount = groups.reduce((n, g) => n + Math.max(0, g.slots.length - SLOTS_PER_GROUP), 0);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setBooking(true);
    setError(null);

    const result = await bookAppointmentAction(selectedSlot.slotStart, selectedType);

    setBooking(false);

    if (!result.success) {
      setError(result.error);
      await loadSlots(selectedType);
      return;
    }

    setLock({ startsAt: selectedSlot.slotStart });
    setConfirmed(selectedSlot);
    setSelectedSlot(null);
  }

  if (confirmed) {
    return <BookingTicket slot={confirmed} />;
  }

  const selectedOption = options.find((o) => o.name === selectedType);

  const header = (
    <div className="rounded-xl bg-[var(--color-salvia)] px-5 py-5 sm:px-6">
      {selectedOption ? (
        <p className="text-sm text-[var(--color-muted)]">
          {selectedOption.name} · {selectedOption.durationMinutes} minuti
        </p>
      ) : null}
      <h1 className="mt-1 font-display text-[34px] leading-[1.1] text-[var(--color-ink)] sm:text-[40px]">
        Quando ti fa comodo?
      </h1>
      <p className="mt-2 text-[16px] text-[var(--color-muted)]">
        Ecco gli orari liberi. Scegli quello che preferisci e conferma.
      </p>
    </div>
  );

  const lockBanner = lock ? (
    <div className="rounded-xl border border-[var(--color-status-pending)]/30 bg-[var(--color-status-pending-bg)] p-5">
      <p className="text-[16px] font-semibold text-[var(--color-ink)]">
        Hai già un appuntamento: {capitalize(formatDayLong(lock.startsAt))} alle {formatTime(lock.startsAt)}
      </p>
      <p className="mt-1.5 text-[16px] text-[var(--color-ink)]">
        Potrai prenotarne un altro dall&apos;inizio della visita. Se devi cambiare orario, vai su{" "}
        <Link
          href="/portale/i-miei-appuntamenti"
          className="font-semibold text-[var(--color-ink)] underline underline-offset-2"
        >
          I miei appuntamenti
        </Link>{" "}
        e chiedi lo spostamento.
      </p>
    </div>
  ) : null;

  const typeSelector =
    options.length > 1 ? (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-[var(--color-ink)]">Cosa vuoi prenotare?</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = option.name === selectedType;
            return (
              <button
                key={option.name}
                onClick={() => handleTypeChange(option.name)}
                aria-pressed={active}
                className={`min-h-[44px] rounded-lg border px-4 py-2.5 text-[16px] transition-colors ${
                  active
                    ? "border-[var(--color-ink)] bg-[var(--color-surface)] font-semibold text-[var(--color-ink)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-ink)]"
                }`}
              >
                {option.name} · {option.durationMinutes} min
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  const errorMessage = error ? (
    <p role="alert" className="rounded-lg bg-[var(--color-status-cancelled-bg)] px-4 py-3 text-[15px] text-[var(--color-status-cancelled)]">
      {error}
    </p>
  ) : null;

  let body: React.ReactNode;
  if (loading) {
    body = <p className="text-[16px] text-[var(--color-muted)]">Cerco gli orari liberi…</p>;
  } else if (days.length === 0) {
    body = error ? null : (
      <p className="text-[16px] text-[var(--color-muted)]">
        Nei prossimi due mesi non ci sono orari liberi. Contatta lo studio: troveremo una soluzione
        insieme.
      </p>
    );
  } else {
    body = (
      <div className="flex flex-col gap-2">
        <div
          role="tablist"
          aria-label="Giorni con orari liberi"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
        >
          {days.map((day) => {
            const active = day === selectedDay;
            return (
              <button
                key={day}
                role="tab"
                aria-selected={active}
                onClick={() => handleDayChange(day)}
                className={`flex min-h-[60px] min-w-[56px] shrink-0 flex-col items-center justify-center rounded-lg border bg-[var(--color-surface)] px-3 py-2 transition-colors ${
                  active
                    ? "border-[var(--color-ink)]"
                    : "border-[var(--color-line)] hover:border-[var(--color-muted)]"
                }`}
              >
                <span className="text-[13px] text-[var(--color-muted)]">
                  {capitalize(formatDateKey(day, { weekday: "short" }).replace(".", ""))}
                </span>
                <span className="font-figures text-[19px] font-bold text-[var(--color-ink)]">
                  {formatDateKey(day, { day: "numeric" })}
                </span>
              </button>
            );
          })}
        </div>
        {selectedDay ? (
          <p className="text-[15px] text-[var(--color-muted)]">
            {capitalize(formatDateKey(selectedDay, { weekday: "long", day: "numeric", month: "long" }))}
          </p>
        ) : null}

        {groups.map((group) => (
          <div key={group.title} className="mt-3">
            <h2 className="font-display text-[20px] text-[var(--color-ink)]">{group.title}</h2>
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {(showAllSlots ? group.slots : group.slots.slice(0, SLOTS_PER_GROUP)).map((slot) => {
                const active = selectedSlot?.slotStart === slot.slotStart;
                return (
                  <button
                    key={slot.slotStart}
                    onClick={() => setSelectedSlot(slot)}
                    disabled={lock !== null || booking}
                    aria-pressed={active}
                    className={`min-h-[44px] rounded-lg border py-2.5 font-figures text-[17px] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? "border-[var(--color-accent-hover)] bg-[var(--color-argilla)] font-bold text-[var(--color-accent-hover)]"
                        : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] enabled:hover:border-[var(--color-ink)]"
                    }`}
                  >
                    {formatTime(slot.slotStart)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {hiddenCount > 0 && !showAllSlots ? (
          <button
            onClick={() => setShowAllSlots(true)}
            className="mt-3 self-start py-2 text-[16px] text-[var(--color-ink)] underline underline-offset-4"
          >
            Altri orari ({hiddenCount})
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${selectedSlot ? "pb-44" : ""}`}>
      {header}
      {lockBanner}
      {typeSelector}
      {errorMessage}
      {body}

      {selectedSlot ? (
        <div className="fixed inset-x-0 bottom-0 z-20" aria-live="polite">
          <div className="animate-sheet-up mx-auto max-w-3xl rounded-t-[20px] border-t border-[var(--color-line)] bg-[var(--color-surface)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-12px_30px_-18px_rgba(22,38,30,0.4)] sm:px-6">
            <p className="font-display text-[22px] leading-tight text-[var(--color-ink)]">
              {formatSlotSentence(selectedSlot)}
            </p>
            <p className="mt-1 text-[15px] text-[var(--color-muted)]">
              {selectedSlot.appointmentTypeName} · {selectedSlot.durationMinutes} minuti
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={booking}
                className="min-h-[48px] flex-1 rounded-lg bg-[var(--color-accent)] px-4 text-[16px] font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
              >
                {booking ? "Prenoto…" : "Conferma"}
              </button>
              <button
                onClick={() => setSelectedSlot(null)}
                disabled={booking}
                className="min-h-[48px] px-3 text-[16px] text-[var(--color-ink)] underline underline-offset-4"
              >
                Cambia
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
