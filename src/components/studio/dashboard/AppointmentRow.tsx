import type { Appointment } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDayShort, formatTime } from "@/lib/format";

// La riga si adatta allo spazio del riquadro che la contiene (container
// query), non alla larghezza dello schermo: la stessa riga sta sia
// nell'agenda larga sia nella colonna stretta "Prossimi appuntamenti".
export function AppointmentRow({
  appointment,
  showDate = false,
}: {
  appointment: Appointment;
  showDate?: boolean;
}) {
  return (
    <div className="@container border-b border-[var(--color-line)] py-3 last:border-none">
      <div className="flex items-start gap-3 @sm:items-center @sm:gap-4">
        <div className="w-[4.5rem] shrink-0 whitespace-nowrap pt-px font-figures text-[15px] text-[var(--color-ink)]">
          {showDate ? formatDayShort(appointment.startsAt) : formatTime(appointment.startsAt)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 @sm:flex-row @sm:items-center @sm:justify-between @sm:gap-4">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-[var(--color-ink)]">
              {appointment.clientName}
            </p>
            <p className="truncate text-sm text-[var(--color-muted)]">{appointment.appointmentTypeName}</p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={appointment.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
