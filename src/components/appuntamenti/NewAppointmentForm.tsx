"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createAppointmentAction, getAvailableSlotsAction } from "@/lib/actions/appointments";
import type { Client } from "@/types";

type AppointmentTypeOption = { id: string; name: string; duration_minutes: number };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
}

export function NewAppointmentForm({
  clients,
  appointmentTypes,
  defaultClientId,
}: {
  clients: Client[];
  appointmentTypes: AppointmentTypeOption[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedType = appointmentTypes.find((t) => t.id === appointmentTypeId);

  useEffect(() => {
    setSelectedSlot(null);
    if (!appointmentTypeId || !date || !selectedType) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    getAvailableSlotsAction(date, selectedType.duration_minutes).then((result) => {
      if (!cancelled) {
        setSlots(result);
        setLoadingSlots(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentTypeId, date]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!clientId || !appointmentTypeId || !selectedSlot) {
      setError("Seleziona cliente, tipo e un orario libero.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("appointmentTypeId", appointmentTypeId);
    formData.set("startsAt", selectedSlot);
    formData.set("notes", notes);

    const result = await createAppointmentAction(formData);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/appuntamenti");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="clientId" className="text-sm font-medium text-[var(--color-ink)]">
          Cliente
        </label>
        <select
          id="clientId"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        >
          <option value="" disabled>
            Seleziona un cliente…
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="appointmentTypeId" className="text-sm font-medium text-[var(--color-ink)]">
          Tipo di appuntamento
        </label>
        <select
          id="appointmentTypeId"
          required
          value={appointmentTypeId}
          onChange={(e) => setAppointmentTypeId(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        >
          <option value="" disabled>
            Seleziona un tipo…
          </option>
          {appointmentTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} ({type.duration_minutes} min)
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="date" className="text-sm font-medium text-[var(--color-ink)]">
          Data
        </label>
        <input
          id="date"
          type="date"
          required
          value={date}
          min={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-[var(--color-ink)]">Orario</p>

        {!appointmentTypeId ? (
          <p className="text-sm text-[var(--color-muted)]">
            Scegli prima il tipo di appuntamento, per vedere gli orari liberi.
          </p>
        ) : loadingSlots ? (
          <p className="text-sm text-[var(--color-muted)]">Carico gli orari liberi…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Nessun orario libero in questa data. Prova un altro giorno.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`min-h-[40px] rounded-lg border px-3.5 py-2 text-[15px] font-medium transition-colors ${
                  selectedSlot === slot
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                    : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                }`}
              >
                {formatTime(slot)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-[var(--color-ink)]">
          Note operative (facoltative)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || !selectedSlot}
        className="mt-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {submitting ? "Salvo…" : "Crea appuntamento"}
      </button>
    </form>
  );
}
