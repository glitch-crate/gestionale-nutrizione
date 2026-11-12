import { romeDateKey, addDaysToKey, isoDow, romeDayStart, romeDayEnd } from "@/lib/timezone";
import Link from "next/link";
import { getAppointmentsInRange } from "@/lib/queries/studio/appuntamenti";
import { getTimeBlocksInRange } from "@/lib/queries/studio/calendario";
import { CalendarNav } from "@/components/studio/calendario/CalendarNav";
import { DayView } from "@/components/studio/calendario/DayView";
import { WeekView } from "@/components/studio/calendario/WeekView";
import { BlockTimeForm } from "@/components/studio/calendario/BlockTimeForm";
import { TimeBlockRow } from "@/components/studio/calendario/TimeBlockRow";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "settimana" ? "settimana" : "giorno";
  const currentDate = params.date ?? romeDateKey();

  const weekStartKey = addDaysToKey(currentDate, -(isoDow(currentDate) - 1));
  const from = romeDayStart(view === "giorno" ? currentDate : weekStartKey);
  const to = romeDayEnd(view === "giorno" ? currentDate : addDaysToKey(weekStartKey, 6));

  const [appointments, timeBlocks] = await Promise.all([
    getAppointmentsInRange(from, to),
    getTimeBlocksInRange(from, to),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl text-[var(--color-ink)]">
          Calendario
        </h1>
        <div className="flex flex-wrap gap-2">
          <BlockTimeForm defaultDate={currentDate} />
          <Link
            href="/appuntamenti/nuovo"
            className="w-fit rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            + Nuovo appuntamento
          </Link>
        </div>
      </div>

      <CalendarNav view={view} currentDate={currentDate} />

      {timeBlocks.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
          {timeBlocks.map((block) => (
            <TimeBlockRow key={block.id} block={block} showDay={view === "settimana"} />
          ))}
        </div>
      ) : null}

      {view === "giorno" ? (
        <DayView appointments={appointments} />
      ) : (
        <WeekView weekStartKey={weekStartKey} appointments={appointments} timeBlocks={timeBlocks} />
      )}
    </div>
  );
}
