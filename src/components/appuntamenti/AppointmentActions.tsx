"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  rescheduleAppointmentAction,
  updateAppointmentStatusAction,
} from "@/lib/actions/appointments";
import type { AppointmentStatus } from "@/types";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const [newTime, setNewTime] = useState(toLocalInputValue(startsAt));
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
            Annulla
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
              className="text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Sposta
            </button>
            <button
              onClick={() => handleStatusChange("completato")}
              disabled={loading}
              className="text-sm font-medium text-[var(--color-muted)] hover:underline disabled:opacity-60"
            >
              Completa
            </button>
            <button
              onClick={() => handleStatusChange("annullato")}
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
