import Link from "next/link";
import { STATUS_DOT } from "@/components/shared/StatusBadge";
import { formatDateKey, formatTime } from "@/lib/format";
import { addDaysToKey, romeDateKey, romeDayEnd, romeDayStart } from "@/lib/timezone";
import type { Appointment, TimeBlock } from "@/types";

export function WeekView({
  weekStartKey,
  appointments,
  timeBlocks = [],
}: {
  weekStartKey: string;
  appointments: Appointment[];
  timeBlocks?: TimeBlock[];
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {days.map((day) => {
        const dayKey = day;
        const dayAppointments = appointments
          .filter((a) => romeDateKey(new Date(a.startsAt)) === dayKey)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

        const isToday = dayKey === romeDateKey();
        const dayStartMs = romeDayStart(dayKey).getTime();
        const dayEndMs = romeDayEnd(dayKey).getTime();
        const dayBlocks = timeBlocks.filter(
          (b) => new Date(b.startsAt).getTime() <= dayEndMs && new Date(b.endsAt).getTime() > dayStartMs,
        );
        // Orari del blocco limitati a questo giorno (per i blocchi di più giorni).
        const clip = (b: TimeBlock) => {
          const s = Math.max(new Date(b.startsAt).getTime(), dayStartMs);
          const e = Math.min(new Date(b.endsAt).getTime(), dayEndMs + 1);
          return `${formatTime(new Date(s).toISOString())}–${e > dayEndMs ? "24:00" : formatTime(new Date(e).toISOString())}`;
        };

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
              {dayBlocks.map((block) => (
                <p
                  key={block.id}
                  className="rounded-md bg-[var(--color-canvas)] px-1.5 py-1 text-sm text-[var(--color-muted)]"
                  title={block.reason ?? undefined}
                >
                  Bloccato · <span className="font-figures">{clip(block)}</span>
                </p>
              ))}
              {dayAppointments.length === 0 && dayBlocks.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">—</p>
              ) : (
                dayAppointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/calendario?view=giorno&date=${dayKey}`}
                    className="flex min-w-0 items-start gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-[var(--color-canvas)] xl:flex-col xl:gap-0"
                    title={appointment.clientName}
                  >
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[appointment.status]}`}
                      />
                      <span className="font-figures text-[var(--color-ink)]">{formatTime(appointment.startsAt)}</span>
                    </span>
                    <span className="min-w-0 truncate text-[var(--color-muted)] xl:line-clamp-2 xl:w-full xl:whitespace-normal xl:pl-3 xl:leading-snug">
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
