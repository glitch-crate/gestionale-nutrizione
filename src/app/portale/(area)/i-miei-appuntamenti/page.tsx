import { StatusBadge } from "@/components/shared/StatusBadge";
import { RescheduleButton, WithdrawButton } from "@/components/portale/i-miei-appuntamenti/RescheduleControls";
import { formatDateTimeLong as formatDateTime } from "@/lib/format";
import { rescheduleDeadline } from "@/lib/timezone";
import {
  getMyAppointments,
  getMyRescheduleRequests,
  type MyRescheduleRequest,
} from "@/lib/queries/portale/appuntamenti";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function IMieiAppuntamentiPage() {
  const [appointments, requests] = await Promise.all([getMyAppointments(), getMyRescheduleRequests()]);

  const now = new Date().getTime();
  const isActive = (r: MyRescheduleRequest) =>
    r.status === "in_attesa" && new Date(r.expires_at).getTime() > now;
  const hasPending = requests.some(isActive);

  // Prima gli appuntamenti in programma (dal più vicino), poi lo storico
  // (dal più recente), così quello che conta non si perde tra gli annullati.
  const isUpcoming = (a: (typeof appointments)[number]) =>
    a.status !== "annullato" && a.status !== "completato" && new Date(a.ends_at).getTime() > now;
  const upcoming = appointments.filter(isUpcoming).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const history = appointments.filter((a) => !isUpcoming(a));

  function renderAppointment(appointment: (typeof appointments)[number]) {
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
              {appointment.appointment_type_name ?? "Appuntamento"}
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        {pending ? (
          <div className="flex flex-col gap-3 rounded-lg bg-[var(--color-status-pending-bg)] px-4 py-3">
            <div>
              <p className="text-[15px] font-medium text-[var(--color-status-pending)]">
                Richiesta di spostamento in attesa
              </p>
              <p className="mt-1 text-[15px] text-[var(--color-ink)]">
                Hai chiesto di spostare a <strong>{formatDateTime(pending.new_starts_at)}</strong>.
                Quell&apos;orario è riservato per te fino a{" "}
                {formatDateTime(rescheduleDeadline(pending.expires_at, pending.new_starts_at))}.
                Fino alla risposta dello studio il tuo appuntamento resta com&apos;è e non puoi
                prenotarne altri.
              </p>
            </div>
            <WithdrawButton requestId={pending.id} />
          </div>
        ) : null}

        {!pending && lastClosed && isConfirmed ? (
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
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-2xl text-[var(--color-ink)]">
        I miei appuntamenti
      </h1>
      <p className="mb-4 text-[15px] text-[var(--color-muted)]">
        Puoi chiedere di spostare un appuntamento fino a 24 ore prima: lo studio dovrà confermare.
        Per annullarlo, contatta direttamente lo studio.
      </p>

      {appointments.length === 0 ? (
        <p className="text-[15px] text-[var(--color-muted)]">
          Non hai ancora nessun appuntamento prenotato.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-[15px] font-medium text-[var(--color-ink)]">In programma</h2>
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                {upcoming.map(renderAppointment)}
              </div>
            </section>
          ) : null}
          {history.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-[15px] font-medium text-[var(--color-ink)]">Passati e annullati</h2>
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                {history.map(renderAppointment)}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
