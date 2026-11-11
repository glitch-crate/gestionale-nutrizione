import { RequestActions } from "@/components/studio/richieste/RequestActions";
import { capitalize, formatDateTimeLong } from "@/lib/format";
import {
  getPendingRescheduleRequests,
  getRecentlyResolvedRescheduleRequests,
} from "@/lib/queries/studio/richieste";

function formatDateTime(iso: string) {
  return capitalize(formatDateTimeLong(iso));
}

export default async function RichiestePage() {
  const [pending, recent] = await Promise.all([
    getPendingRescheduleRequests(),
    getRecentlyResolvedRescheduleRequests(10),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">
          Richieste di spostamento
        </h1>
        <p className="mt-1 text-[15px] text-[var(--color-muted)]">
          I clienti chiedono di spostare un appuntamento. Il nuovo orario resta riservato fino
          alla scadenza indicata: se approvi, l&apos;appuntamento viene spostato subito.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <p className="text-[15px] text-[var(--color-muted)]">Nessuna richiesta da gestire.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
            >
              <div>
                <p className="text-[17px] font-medium text-[var(--color-ink)]">
                  {req.clients?.first_name} {req.clients?.last_name}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {req.appointments?.appointment_types?.name ?? "Appuntamento"}
                  {req.clients?.phone ? ` · ${req.clients.phone}` : ""}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-[var(--color-canvas)] px-3.5 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                    Da
                  </p>
                  <p className="mt-0.5 text-[15px] font-medium text-[var(--color-ink)]">
                    {formatDateTime(req.old_starts_at)}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--color-status-pending-bg)] px-3.5 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-status-pending)]">
                    A
                  </p>
                  <p className="mt-0.5 text-[15px] font-medium text-[var(--color-ink)]">
                    {formatDateTime(req.new_starts_at)}
                  </p>
                </div>
              </div>

              <p className="text-sm text-[var(--color-muted)]">
                Orario riservato fino a {formatDateTime(req.expires_at)}.
              </p>

              <RequestActions requestId={req.id} />
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-[15px] font-medium text-[var(--color-ink)]">Gestite di recente</h2>
          <div className="mt-2">
            {recent.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[var(--color-line)] py-3 text-[15px] last:border-none"
              >
                <p className="text-[var(--color-ink)]">
                  {req.clients?.first_name} {req.clients?.last_name}:{" "}
                  <span className="text-[var(--color-muted)]">
                    {formatDateTime(req.old_starts_at)} → {formatDateTime(req.new_starts_at)}
                  </span>
                </p>
                <span
                  className={`text-sm font-medium ${
                    req.status === "approvata"
                      ? "text-[var(--color-status-confirmed)]"
                      : "text-[var(--color-status-cancelled)]"
                  }`}
                >
                  {req.status === "approvata" ? "Approvata" : "Rifiutata"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
