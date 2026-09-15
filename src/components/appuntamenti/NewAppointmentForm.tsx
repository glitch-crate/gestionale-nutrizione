"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAppointmentAction } from "@/lib/actions/appointments";
import type { Client } from "@/types";

type AppointmentTypeOption = { id: string; name: string; duration_minutes: number };

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createAppointmentAction(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/appuntamenti");
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="clientId" className="text-sm font-medium text-[var(--color-ink)]">
          Cliente
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          defaultValue={defaultClientId ?? ""}
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
          name="appointmentTypeId"
          required
          defaultValue=""
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
        <label htmlFor="startsAt" className="text-sm font-medium text-[var(--color-ink)]">
          Data e ora
        </label>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          required
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-[var(--color-ink)]">
          Note operative (facoltative)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {loading ? "Salvo…" : "Crea appuntamento"}
      </button>
    </form>
  );
}
