import Link from "next/link";
import { getAppointmentsInRange } from "@/lib/queries";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AppointmentActions } from "@/components/appuntamenti/AppointmentActions";

function formatDateTime(iso: string) {
  const label = new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function AppuntamentiPage() {
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to = new Date();
  to.setDate(to.getDate() + 90);

  const appointments = await getAppointmentsInRange(from, to);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
            Appuntamenti
          </h1>
          <p className="mt-1 text-[15px] text-[var(--color-muted)]">
            Ultimi 7 giorni e prossimi 90
          </p>
        </div>
        <Link
          href="/appuntamenti/nuovo"
          className="w-fit rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          + Nuovo appuntamento
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-[15px] text-[var(--color-muted)]">Nessun appuntamento in questo periodo.</p>
      ) : (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col gap-3 border-b border-[var(--color-line)] px-4 py-4 last:border-none sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
            >
              <div>
                <p className="text-[15px] font-medium text-[var(--color-ink)]">
                  {appointment.clientName}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {formatDateTime(appointment.startsAt)} · {appointment.appointmentTypeName}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <StatusBadge status={appointment.status} />
                <AppointmentActions
                  appointmentId={appointment.id}
                  status={appointment.status}
                  startsAt={appointment.startsAt}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
