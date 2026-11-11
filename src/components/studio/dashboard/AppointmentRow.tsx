import type { Appointment } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDayShort, formatTime } from "@/lib/format";

export function AppointmentRow({
  appointment,
  showDate = false,
}: {
  appointment: Appointment;
  showDate?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--color-line)] py-3.5 last:border-none">
      <div className="flex min-w-0 items-center gap-4">
        <div className="w-16 shrink-0 font-figures text-[15px] text-[var(--color-ink)]">
          {showDate ? formatDayShort(appointment.startsAt) : formatTime(appointment.startsAt)}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[var(--color-ink)]">
            {appointment.clientName}
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            {appointment.appointmentTypeName}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        <StatusBadge status={appointment.status} />
      </div>
    </div>
  );
}
