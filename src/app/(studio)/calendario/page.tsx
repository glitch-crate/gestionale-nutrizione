import Link from "next/link";
import { getAppointmentsInRange } from "@/lib/queries";
import { CalendarNav } from "@/components/calendario/CalendarNav";
import { DayView } from "@/components/calendario/DayView";
import { WeekView } from "@/components/calendario/WeekView";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = lunedì
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "settimana" ? "settimana" : "giorno";
  const currentDate = params.date ?? new Date().toISOString().slice(0, 10);

  let from: Date;
  let to: Date;

  if (view === "giorno") {
    from = new Date(currentDate);
    from.setHours(0, 0, 0, 0);
    to = new Date(currentDate);
    to.setHours(23, 59, 59, 999);
  } else {
    from = startOfWeek(new Date(currentDate));
    to = new Date(from);
    to.setDate(to.getDate() + 7);
    to.setHours(23, 59, 59, 999);
  }

  const appointments = await getAppointmentsInRange(from, to);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
          Calendario
        </h1>
        <Link
          href="/appuntamenti/nuovo"
          className="w-fit rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          + Nuovo appuntamento
        </Link>
      </div>

      <CalendarNav view={view} currentDate={currentDate} />

      {view === "giorno" ? (
        <DayView appointments={appointments} />
      ) : (
        <WeekView weekStart={from} appointments={appointments} />
      )}
    </div>
  );
}
