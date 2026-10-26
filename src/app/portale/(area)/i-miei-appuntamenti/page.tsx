import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RescheduleButton, WithdrawButton } from "@/components/portale/RescheduleControls";
import type { AppointmentStatus } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type RequestRow = {
  id: string;
  appointment_id: string;
  old_starts_at: string;
  new_starts_at: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export default async function IMieiAppuntamentiPage() {
  const supabase = await createClient();

  // Grazie alla RLS, questa query restituisce SOLO gli appuntamenti del
  // cliente autenticato: non serve (e non basterebbe) filtrare a mano.
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, appointment_types(name)")
    .order("starts_at", { ascending: false });

  // Richieste di spostamento del cliente (anche qui filtra la RLS).
  // Se la funzione non è ancora attiva nel database, l'elenco resta vuoto.
  const { data: requestsData } = await supabase
    .from("reschedule_requests")
    .select("id, appointment_id, old_starts_at, new_starts_at, status, expires_at, created_at")
    .order("created_at", { ascending: false });
  const requests = (requestsData ?? []) as RequestRow[];

  const now = new Date().getTime();
  const isActive = (r: RequestRow) => r.status === "in_attesa" && new Date(r.expires_at).getTime() > now;
  const hasPending = requests.some(isActive);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
        I miei appuntamenti
      </h1>
      <p className="mb-4 text-[15px] text-[var(--color-muted)]">
        Puoi chiedere di spostare un appuntamento fino a 24 ore prima: lo studio dovrà confermare.
        Per annullarlo, contatta direttamente lo studio.
      </p>

      {!appointments || appointments.length === 0 ? (
        <p className="text-[15px] text-[var(--color-muted)]">
          Non hai ancora nessun appuntamento prenotato.
        </p>
      ) : (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          {appointments.map((appointment) => {
            const forThis = requests.filter((r) => r.appointment_id === appointment.id);
            const pending = forThis.find(isActive);
            const lastClosed = forThis.find(
              (r) =>
                !isActive(r) &&
                r.status !== "annullata" &&
                now - new Date(r.created_at).getTime() < 7 * DAY_MS,
            );
            const startsMs = new Date(appointment.starts_at).getTime();
            const isConfirmed = appointment.status === "confermato";
            const canRequest = isConfirmed && startsMs - now >= DAY_MS && !hasPending;
            const tooLate = isConfirmed && startsMs > now && startsMs - now < DAY_MS;

            return (
              <div
                key={appointment.id}
                className="flex flex-col gap-3 border-b border-[var(--color-line)] py-3.5 last:border-none"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
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

                {pending ? (
                  <div className="flex flex-col gap-3 rounded-lg bg-[var(--color-status-pending-bg)] px-4 py-3">
                    <div>
                      <p className="text-[15px] font-medium text-[var(--color-status-pending)]">
                        Richiesta di spostamento in attesa
                      </p>
                      <p className="mt-1 text-[15px] text-[var(--color-ink)]">
                        Hai chiesto di spostare a <strong>{formatDateTime(pending.new_starts_at)}</strong>.
                        Quell&apos;orario è riservato per te fino a {formatDateTime(pending.expires_at)}.
                        Fino alla risposta dello studio il tuo appuntamento resta com&apos;è e non puoi
                        prenotarne altri.
                      </p>
                    </div>
                    <WithdrawButton requestId={pending.id} />
                  </div>
                ) : null}

                {!pending && lastClosed ? (
                  <p
                    className={`rounded-lg px-4 py-3 text-[15px] ${
                      lastClosed.status === "approvata"
                        ? "bg-[var(--color-status-confirmed-bg)] text-[var(--color-status-confirmed)]"
                        : "bg-[var(--color-status-cancelled-bg)] text-[var(--color-status-cancelled)]"
                    }`}
                  >
                    {lastClosed.status === "approvata"
                      ? "Spostamento approvato: l'appuntamento è stato spostato all'orario che hai scelto."
                      : lastClosed.status === "rifiutata"
                        ? "Lo studio non ha potuto accettare lo spostamento: l'appuntamento resta all'orario indicato qui sopra."
                        : "La richiesta di spostamento non ha ricevuto risposta ed è scaduta: l'appuntamento resta all'orario indicato qui sopra."}
                  </p>
                ) : null}

                {canRequest ? <RescheduleButton appointmentId={appointment.id} /> : null}

                {tooLate && !pending ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    Mancano meno di 24 ore: per modifiche contatta direttamente lo studio.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
