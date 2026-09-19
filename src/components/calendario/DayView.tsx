import type { Appointment } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AppointmentActions } from "@/components/appuntamenti/AppointmentActions";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function DayView({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-[15px] text-[var(--color-muted)]">
        Nessun appuntamento in questo giorno.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="flex flex-col gap-3 border-b border-[var(--color-line)] px-4 py-4 last:border-none sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 shrink-0 text-[15px] font-medium text-[var(--color-ink)]">
              {formatTime(appointment.startsAt)}
            </div>
            <div>
              <p className="text-[15px] font-medium text-[var(--color-ink)]">
                {appointment.clientName}
              </p>
              <p className="text-sm text-[var(--color-muted)]">{appointment.appointmentTypeName}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pl-20 sm:gap-4 sm:pl-0">
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
  );
}
