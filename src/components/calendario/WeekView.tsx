import Link from "next/link";
import type { Appointment } from "@/types";

const STATUS_DOT: Record<string, string> = {
  da_confermare: "bg-[var(--color-status-pending)]",
  confermato: "bg-[var(--color-status-confirmed)]",
  completato: "bg-[var(--color-status-done)]",
  annullato: "bg-[var(--color-status-cancelled)]",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function WeekView({
  weekStart,
  appointments,
}: {
  weekStart: Date;
  appointments: Appointment[];
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayKey = day.toISOString().slice(0, 10);
        const dayAppointments = appointments
          .filter((a) => a.startsAt.slice(0, 10) === dayKey)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

        const isToday = dayKey === new Date().toISOString().slice(0, 10);

        return (
          <div
            key={dayKey}
            className={`rounded-xl border p-3 ${
              isToday ? "border-[var(--color-accent)]" : "border-[var(--color-line)]"
            } bg-[var(--color-surface)]`}
          >
            <p className="text-sm font-medium text-[var(--color-ink)]">
              {day.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" })}
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {dayAppointments.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">—</p>
              ) : (
                dayAppointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/appuntamenti`}
                    className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-[var(--color-canvas)]"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[appointment.status]}`}
                    />
                    <span className="text-[var(--color-ink)]">{formatTime(appointment.startsAt)}</span>
                    <span className="truncate text-[var(--color-muted)]">
                      {appointment.clientName}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
