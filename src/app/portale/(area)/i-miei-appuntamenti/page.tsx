import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AppointmentStatus } from "@/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function IMieiAppuntamentiPage() {
  const supabase = await createClient();

  // Grazie alla RLS, questa query restituisce SOLO gli appuntamenti del
  // cliente autenticato: non serve (e non basterebbe) filtrare a mano.
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, appointment_types(name)")
    .order("starts_at", { ascending: false });

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
        I miei appuntamenti
      </h1>
      <p className="mb-4 text-[15px] text-[var(--color-muted)]">
        Per spostare o annullare un appuntamento, contatta direttamente lo studio.
      </p>

      {!appointments || appointments.length === 0 ? (
        <p className="text-[15px] text-[var(--color-muted)]">
          Non hai ancora nessun appuntamento prenotato.
        </p>
      ) : (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-[var(--color-line)] py-3.5 last:border-none"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-[var(--color-ink)]">
                  {formatDateTime(appointment.starts_at)}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {(appointment.appointment_types as unknown as { name: string } | null)?.name ??
                    "Appuntamento"}
                </p>
              </div>
              <StatusBadge status={appointment.status as AppointmentStatus} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
