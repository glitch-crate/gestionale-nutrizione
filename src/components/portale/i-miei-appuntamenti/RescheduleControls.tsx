"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelRescheduleRequestAction,
  requestRescheduleAction,
} from "@/lib/actions/portale/i-miei-appuntamenti";
import { fetchRescheduleSlots } from "@/lib/browser/portale";
import { capitalize, formatDayLong, formatTime } from "@/lib/format";
import { addDaysToKey, romeDateKey } from "@/lib/timezone";

// Stessa logica della prenotazione: finestra di circa due mesi, scaricata a
// blocchi di 15 giorni (il database restituisce al massimo 1000 righe).
const WINDOW_DAYS = 60;
const CHUNK_DAYS = 15;
const DAYS_PER_PAGE = 7;

function formatDayLabel(iso: string) {
  return capitalize(formatDayLong(iso));
}

export function RescheduleButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE);

  async function loadSlots() {
    setLoading(true);
    setError(null);
    setSelected(null);
    setVisibleDays(DAYS_PER_PAGE);
    const today = romeDateKey();

    async function fetchChunk(offset: number) {
      const params = {
        p_appointment_id: appointmentId,
        p_from: addDaysToKey(today, offset),
        p_to: addDaysToKey(today, Math.min(offset + CHUNK_DAYS - 1, WINDOW_DAYS)),
      };
      let result = await fetchRescheduleSlots(params);
      if (result.error) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        result = await fetchRescheduleSlots(params);
      }
      if (result.error) console.error("get_reschedule_slots", result.error.message);
      return result;
    }

    const offsets: number[] = [];
    for (let offset = 0; offset <= WINDOW_DAYS; offset += CHUNK_DAYS) offsets.push(offset);
    const results = await Promise.all(offsets.map(fetchChunk));
    setLoading(false);

    const failed = results.filter((r) => r.error).length;
    if (failed === results.length) {
      setError("Non è stato possibile caricare gli orari disponibili.");
      return;
    }
    if (failed > 0) {
      setError("Alcuni giorni non sono stati caricati. Chiudi e riapri per vederli tutti.");
    }
    const starts = results
      .flatMap((r) => (r.data ?? []) as { slot_start: string }[])
      .map((row) => row.slot_start)
      .sort();
    setSlots(starts);
  }

  function handleOpen() {
    setOpen(true);
    loadSlots();
  }

  async function handleSend() {
    if (!selected) return;
    setSending(true);
    setError(null);
    const result = await requestRescheduleAction(appointmentId, selected);
    setSending(false);
    if (!result.success) {
      setError(result.error);
      await loadSlots();
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const slotsByDay = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const start of slots) {
      const key = romeDateKey(new Date(start));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(start);
    }
    return Array.from(groups.entries());
  }, [slots]);

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="min-h-[44px] rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        Chiedi di spostare
      </button>
    );
  }

  return (
    <div className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium text-[var(--color-ink)]">Scegli il nuovo orario</p>
        <button
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          Chiudi
        </button>
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        La richiesta deve essere confermata dallo studio. Il nuovo orario resta riservato per te
        fino alla risposta (al massimo 48 ore). Fino ad allora il tuo appuntamento resta com&apos;è.
      </p>

      {error ? <p className="mt-3 text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}

      {loading ? (
        <p className="mt-3 text-[15px] text-[var(--color-muted)]">Carico gli orari disponibili…</p>
      ) : slotsByDay.length === 0 && !error ? (
        <p className="mt-3 text-[15px] text-[var(--color-muted)]">
          Nessun orario disponibile nei prossimi due mesi. Contatta lo studio.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {slotsByDay.slice(0, visibleDays).map(([day, daySlots]) => (
            <div key={day}>
              <p className="text-sm font-medium text-[var(--color-ink)]">{formatDayLabel(daySlots[0])}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {daySlots.map((start) => {
                  const active = start === selected;
                  return (
                    <button
                      key={start}
                      onClick={() => setSelected(start)}
                      aria-pressed={active}
                      className={`min-h-[44px] min-w-[76px] rounded-lg border px-3.5 py-2.5 font-figures text-[17px] transition-colors ${
                        active
                          ? "border-[var(--color-accent-hover)] bg-[var(--color-argilla)] font-bold text-[var(--color-accent-hover)]"
                          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                      }`}
                    >
                      {formatTime(start)}
                    </button>
                  );
                })}
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
      )}

      {selected ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-line)] pt-4">
          <p className="text-[15px] text-[var(--color-ink)]">
            Chiedi di spostare a <strong>{formatDayLabel(selected)}</strong> alle{" "}
            <strong>{formatTime(selected)}</strong>?
          </p>
          <button
            onClick={handleSend}
            disabled={sending}
            className="min-h-[44px] self-start rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {sending ? "Invio…" : "Invia richiesta"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function WithdrawButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleWithdraw() {
    setLoading(true);
    setError(null);
    const result = await cancelRescheduleRequestAction(requestId);
    setLoading(false);
    setConfirming(false);
    if (!result.success) {
      setError(result.error);
      router.refresh();
      return;
    }
    router.refresh();
  }

  // Ritirare libera l'orario riservato: chiediamo conferma.
  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[15px] text-[var(--color-ink)]">
          Ritirare la richiesta? L&apos;orario che avevi scelto torna disponibile per tutti.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="min-h-[44px] rounded-lg bg-[var(--color-status-cancelled)] px-4 py-2.5 text-[15px] font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Ritiro…" : "Sì, ritira"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="min-h-[44px] rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[15px] font-medium text-[var(--color-ink)] disabled:opacity-50"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={() => setConfirming(true)}
        disabled={loading}
        className="min-h-[44px] self-start rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-status-cancelled)] hover:text-[var(--color-status-cancelled)] disabled:opacity-50"
      >
        {loading ? "Ritiro…" : "Ritira la richiesta"}
      </button>
      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
    </div>
  );
}
