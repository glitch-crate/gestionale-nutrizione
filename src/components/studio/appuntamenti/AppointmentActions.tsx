"use client";

import { useState } from "react";
import { toRomeInputValue } from "@/lib/timezone";
import { useRouter } from "next/navigation";
import {
  rescheduleAppointmentAction,
  updateAppointmentStatusAction,
} from "@/lib/actions/studio/appuntamenti";
import type { AppointmentStatus } from "@/types";

export function AppointmentActions({
  appointmentId,
  status,
  startsAt,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  startsAt: string;
}) {
  const router = useRouter();
  const [rescheduling, setRescheduling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  // "Completa" ha senso solo da quando l'appuntamento è iniziato.
  const [now] = useState(() => Date.now());
  const hasStarted = new Date(startsAt).getTime() <= now;
  const [newTime, setNewTime] = useState(toRomeInputValue(startsAt));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(nextStatus: AppointmentStatus) {
    setLoading(true);
    setError(null);
    const result = await updateAppointmentStatusAction(appointmentId, nextStatus);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleReschedule() {
    setLoading(true);
    setError(null);
    const result = await rescheduleAppointmentAction(appointmentId, newTime);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setRescheduling(false);
    router.refresh();
  }

  if (rescheduling) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <input
            type="datetime-local"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-2.5 py-1.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
          />
          <button
            onClick={handleReschedule}
            disabled={loading}
            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            Conferma
          </button>
          <button
            onClick={() => setRescheduling(false)}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Chiudi
          </button>
        </div>
        {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
      </div>
    );
  }

  // Anche "Completa" chiude l'appuntamento in modo definitivo: chiediamo conferma.
  if (confirmingComplete) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <span className="text-sm text-[var(--color-ink)]">Segnare come completato?</span>
          <button
            onClick={async () => {
              await handleStatusChange("completato");
              setConfirmingComplete(false);
            }}
            disabled={loading}
            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            {loading ? "Salvo…" : "Sì, completato"}
          </button>
          <button
            onClick={() => setConfirmingComplete(false)}
            disabled={loading}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            No
          </button>
        </div>
        {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
      </div>
    );
  }

  // Annullare non si può disfare dall'interfaccia: chiediamo conferma.
  if (confirmingCancel) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <span className="text-sm text-[var(--color-ink)]">Annullare l&apos;appuntamento?</span>
          <button
            onClick={async () => {
              await handleStatusChange("annullato");
              setConfirmingCancel(false);
            }}
            disabled={loading}
            className="rounded-lg bg-[var(--color-status-cancelled)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Annullo…" : "Sì, annulla"}
          </button>
          <button
            onClick={() => setConfirmingCancel(false)}
            disabled={loading}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            No
          </button>
        </div>
        {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {status !== "completato" && status !== "annullato" ? (
          <>
            {status === "da_confermare" ? (
              <button
                onClick={() => handleStatusChange("confermato")}
                disabled={loading}
                className="text-sm font-medium text-[var(--color-status-confirmed)] hover:underline disabled:opacity-60"
              >
                Conferma
              </button>
            ) : null}
            <button
              onClick={() => setRescheduling(true)}
              className="text-sm font-medium text-[var(--color-ink)] hover:underline"
            >
              Sposta
            </button>
            {hasStarted ? (
              <button
                onClick={() => setConfirmingComplete(true)}
                disabled={loading}
                className="text-sm font-medium text-[var(--color-muted)] hover:underline disabled:opacity-60"
              >
                Completa
              </button>
            ) : null}
            <button
              onClick={() => setConfirmingCancel(true)}
              disabled={loading}
              className="text-sm font-medium text-[var(--color-status-cancelled)] hover:underline disabled:opacity-60"
            >
              Annulla
            </button>
          </>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
    </div>
  );
}
