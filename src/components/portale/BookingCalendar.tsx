"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AvailableSlot } from "@/types";

function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const label = date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingCalendar() {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<AvailableSlot | null>(null);

  async function loadSlots() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);

    const { data, error: rpcError } = await supabase.rpc("get_available_slots", {
      p_from: from.toISOString().slice(0, 10),
      p_to: to.toISOString().slice(0, 10),
    });

    setLoading(false);

    if (rpcError) {
      setError("Non è stato possibile caricare gli orari disponibili.");
      return;
    }

    const mapped: AvailableSlot[] = (data ?? []).map((row: {
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
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slotsByDay = useMemo(() => {
    const groups = new Map<string, AvailableSlot[]>();
    for (const slot of slots) {
      const dayKey = slot.slotStart.slice(0, 10);
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
    });

    setBooking(null);

    if (rpcError) {
      setError(
        rpcError.message.includes("non è più disponibile")
          ? "Questo orario è stato appena prenotato da qualcun altro. Scegline un altro."
          : "Non è stato possibile completare la prenotazione. Riprova.",
      );
      await loadSlots();
      return;
    }

    setConfirmed(slot);
  }

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
        <button
          onClick={() => {
            setConfirmed(null);
            loadSlots();
          }}
          className="mt-4 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          Prenota un altro appuntamento
        </button>
      </div>
    );
  }

  if (loading) {
    return <p className="text-[15px] text-[var(--color-muted)]">Carico gli orari disponibili…</p>;
  }

  if (error && slots.length === 0) {
    return <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p>;
  }

  if (slotsByDay.length === 0) {
    return (
      <p className="text-[15px] text-[var(--color-muted)]">
        Nessuno slot disponibile nelle prossime due settimane. Contatta lo studio.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p>
      ) : null}
      {slotsByDay.map(([day, daySlots]) => (
        <div key={day} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-[15px] font-medium text-[var(--color-ink)]">
            {formatDayLabel(daySlots[0].slotStart)}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {daySlots.map((slot) => (
              <button
                key={slot.slotStart}
                onClick={() => handleBook(slot)}
                disabled={booking === slot.slotStart}
                className="min-h-[44px] rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
              >
                {booking === slot.slotStart ? "Prenoto…" : formatTime(slot.slotStart)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
