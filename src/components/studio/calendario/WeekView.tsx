import Link from "next/link";
import { STATUS_DOT } from "@/components/shared/StatusBadge";
import { formatDateKey, formatTime } from "@/lib/format";
import { addDaysToKey, romeDateKey } from "@/lib/timezone";
import type { Appointment } from "@/types";

export function WeekView({
  weekStartKey,
  appointments,
}: {
  weekStartKey: string;
  appointments: Appointment[];
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayKey = day;
        const dayAppointments = appointments
          .filter((a) => romeDateKey(new Date(a.startsAt)) === dayKey)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

        const isToday = dayKey === romeDateKey();

        return (
          <div
            key={dayKey}
            className={`rounded-xl border p-3 ${
              isToday ? "border-[var(--color-accent)]" : "border-[var(--color-line)]"
            } bg-[var(--color-surface)]`}
          >
            <p className="text-sm font-medium text-[var(--color-ink)]">
              {formatDateKey(day, { weekday: "short", day: "numeric" })}
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
                    <span className="font-figures text-[var(--color-ink)]">{formatTime(appointment.startsAt)}</span>
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
