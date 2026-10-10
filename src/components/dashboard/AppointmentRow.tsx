import type { Appointment } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { timeZone: "Europe/Rome",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function AppointmentRow({
  appointment,
  showDate = false,
}: {
  appointment: Appointment;
  showDate?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--color-line)] py-3.5 last:border-none">
      <div className="flex items-center gap-4">
        <div className="w-16 shrink-0 text-sm text-[var(--color-muted)]">
          {showDate ? formatDay(appointment.startsAt) : formatTime(appointment.startsAt)}
        </div>
        <div>
          <p className="text-[15px] font-medium text-[var(--color-ink)]">
            {appointment.clientName}
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            {appointment.appointmentTypeName}
          </p>
        </div>
      </div>
      <StatusBadge status={appointment.status} />
    </div>
  );
}
