"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { addDaysToKey, romeDateKey } from "@/lib/timezone";
import type { AvailableSlot } from "@/types";

// Quanto in anticipo i clienti possono prenotare (circa due mesi).
const BOOKING_WINDOW_DAYS = 60;
// Il database restituisce al massimo 1000 righe per richiesta: scarichiamo
// gli orari a blocchi di 15 giorni per non perdere gli ultimi giorni.
const CHUNK_DAYS = 15;
// Quanti giorni con orari mostrare prima di "Mostra altri giorni".
const DAYS_PER_PAGE = 10;

function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const label = date.toLocaleDateString("it-IT", { timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type BookingOption = { name: string; durationMinutes: number };
// Se il cliente ha già un appuntamento in programma (non ancora iniziato) non
// può prenotarne altri: gli orari li vede, ma non può sceglierli.
type BookingLock = { startsAt: string };

export function BookingCalendar() {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<AvailableSlot | null>(null);
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE);
  const [options, setOptions] = useState<BookingOption[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [lock, setLock] = useState<BookingLock | null>(null);

  async function loadSlots(typeName: string | null = selectedType) {
    setLoading(true);
    setVisibleDays(DAYS_PER_PAGE);
    setError(null);
    const supabase = createClient();

    const today = romeDateKey();

    // Ogni blocco viene ritentato una volta se fallisce (rete o sessione
    // momentaneamente non disponibili) prima di considerarlo un errore.
    async function fetchChunk(offset: number) {
      const params = {
        p_type_name: typeName,
        p_from: addDaysToKey(today, offset),
        p_to: addDaysToKey(today, Math.min(offset + CHUNK_DAYS - 1, BOOKING_WINDOW_DAYS)),
      };
      let result = await supabase.rpc("get_available_slots", params);
      if (result.error) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        result = await supabase.rpc("get_available_slots", params);
      }
      if (result.error) console.error("get_available_slots", params, result.error);
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
      .flatMap((r) => r.data ?? [])
      .sort((x: { slot_start: string }, y: { slot_start: string }) => x.slot_start.localeCompare(y.slot_start));

    if (failedCount > 0) {
      setError("Alcuni giorni non sono stati caricati. Ricarica la pagina per vederli tutti.");
    }

    const mapped: AvailableSlot[] = data.map((row: {
      slot_start: string;
      slot_end: string;
      duration_minutes: number;
      appointment_type_name: string;
    }) => ({
      slotStart: row.slot_start,
      slotEnd: row.slot_end,
      durationMinutes: row.duration_minutes,
      appointmentTypeName: row.appointment_type_name,
    }));

    setSlots(mapped);
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: lockData } = await supabase.rpc("get_booking_lock");
      const lockRow = (lockData ?? [])[0] as { lock_starts_at: string } | undefined;
      if (lockRow) {
        setLock({ startsAt: lockRow.lock_starts_at });
      }
      const { data } = await supabase.rpc("get_booking_options");
      const loaded: BookingOption[] = (data ?? []).map(
        (row: { name: string; duration_minutes: number }) => ({
          name: row.name,
          durationMinutes: row.duration_minutes,
        }),
      );
      setOptions(loaded);
      // Il primo tipo (il più breve) è quello predefinito, come prima.
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
    setConfirmed(null);
    loadSlots(typeName);
  }

  const slotsByDay = useMemo(() => {
    const groups = new Map<string, AvailableSlot[]>();
    for (const slot of slots) {
      const dayKey = romeDateKey(new Date(slot.slotStart));
      if (!groups.has(dayKey)) groups.set(dayKey, []);
      groups.get(dayKey)!.push(slot);
    }
    return Array.from(groups.entries());
  }, [slots]);

  async function handleBook(slot: AvailableSlot) {
    setBooking(slot.slotStart);
    setError(null);
    const supabase = createClient();

    const { error: rpcError } = await supabase.rpc("book_appointment", {
      p_starts_at: slot.slotStart,
      p_type_name: selectedType,
    });

    setBooking(null);

    if (rpcError) {
      setError(
        rpcError.message.includes("non è più disponibile")
          ? "Questo orario è stato appena prenotato da qualcun altro. Scegline un altro."
          : rpcError.message.includes("già un appuntamento")
            ? "Hai già un appuntamento in programma: potrai prenotarne un altro dall'inizio della visita."
          : rpcError.message.includes("richiesta di spostamento")
            ? "Hai una richiesta di spostamento in attesa: potrai prenotare di nuovo quando lo studio risponde."
            : "Non è stato possibile completare la prenotazione. Riprova.",
      );
      await loadSlots(selectedType);
      return;
    }

    // Da ora il cliente ha un appuntamento in programma: gli orari restano visibili ma grigi.
    setLock({ startsAt: slot.slotStart });
    setConfirmed(slot);
  }

  const lockBanner = lock ? (
    <div className="rounded-xl border border-[var(--color-status-pending)]/30 bg-[var(--color-status-pending-bg)] p-5">
      <p className="text-[15px] font-medium text-[var(--color-ink)]">
        Hai già un appuntamento: {formatDayLabel(lock.startsAt)} alle {formatTime(lock.startsAt)}
      </p>
      <p className="mt-1.5 text-[15px] text-[var(--color-ink)]">
        Potrai prenotarne un altro dall&apos;inizio della visita. Qui sotto vedi gli orari liberi,
        ma per ora non puoi sceglierli.
      </p>
      <p className="mt-1.5 text-[15px] text-[var(--color-ink)]">
        Se devi cambiare orario, vai su{" "}
        <Link
          href="/portale/i-miei-appuntamenti"
          className="font-medium text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)]"
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
        <p className="text-sm font-medium text-[var(--color-ink)]">Cosa vuoi prenotare?</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = option.name === selectedType;
            return (
              <button
                key={option.name}
                onClick={() => handleTypeChange(option.name)}
                aria-pressed={active}
                className={`min-h-[44px] rounded-lg border px-4 py-2.5 text-[15px] font-medium transition-colors ${
                  active
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                    : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                }`}
              >
                {option.name} ({option.durationMinutes} min)
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  if (confirmed) {
    return (
      <div className="rounded-xl border border-[var(--color-status-confirmed)]/30 bg-[var(--color-status-confirmed-bg)] p-6">
        <p className="text-[15px] font-medium text-[var(--color-status-confirmed)]">
          Appuntamento confermato
        </p>
        <p className="mt-2 text-[var(--color-ink)]">
          {formatDayLabel(confirmed.slotStart)} alle {formatTime(confirmed.slotStart)} —{" "}
          {confirmed.appointmentTypeName} ({confirmed.durationMinutes} min)
        </p>
        <div className="mt-4 rounded-lg bg-[var(--color-surface)] p-4">
          <p className="text-[15px] font-medium text-[var(--color-ink)]">
            Puoi cambiare la tua prenotazione fino a 24 ore prima
          </p>
          <p className="mt-1.5 text-[15px] text-[var(--color-muted)]">
            Vai su &ldquo;I miei appuntamenti&rdquo; e premi &ldquo;Chiedi di spostare&rdquo;: scegli un nuovo
            orario e lo studio dovrà confermare. Finché non risponde, l&apos;appuntamento resta
            com&apos;è. Per annullarlo, contatta lo studio.
          </p>
        </div>
        <Link
          href="/portale/i-miei-appuntamenti"
          className="mt-4 inline-block text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          Vai a I miei appuntamenti
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="text-[15px] text-[var(--color-muted)]">Carico gli orari disponibili…</p>;
  }

  if (error && slots.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {lockBanner}
        {typeSelector}
        <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p>
      </div>
    );
  }

  if (slotsByDay.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {lockBanner}
        {typeSelector}
        <p className="text-[15px] text-[var(--color-muted)]">
          Nessuno slot disponibile nei prossimi due mesi. Contatta lo studio.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {lockBanner}
      {typeSelector}
      {error ? (
        <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p>
      ) : null}
      {slotsByDay.slice(0, visibleDays).map(([day, daySlots]) => (
        <div key={day} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-[15px] font-medium text-[var(--color-ink)]">
            {formatDayLabel(daySlots[0].slotStart)}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {daySlots.map((slot) => (
              <button
                key={slot.slotStart}
                onClick={() => handleBook(slot)}
                disabled={lock !== null || booking === slot.slotStart}
                className={`min-h-[44px] rounded-lg border px-3.5 py-2.5 text-[15px] font-medium transition-colors ${
                  lock
                    ? "cursor-not-allowed border-[var(--color-line)] bg-[var(--color-canvas)] text-[var(--color-muted)] opacity-60"
                    : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
                }`}
              >
                {booking === slot.slotStart ? "Prenoto…" : formatTime(slot.slotStart)}
              </button>
            ))}
          </div>
        </div>
      ))}
      {slotsByDay.length > visibleDays ? (
        <button
          onClick={() => setVisibleDays((n) => n + DAYS_PER_PAGE)}
          className="min-h-[44px] rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[15px] font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          Mostra altri giorni
        </button>
      ) : null}
    </div>
  );
}
