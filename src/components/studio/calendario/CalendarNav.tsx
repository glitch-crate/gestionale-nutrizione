"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { formatDateKey } from "@/lib/format";
import { addDaysToKey, isoDow, romeDateKey } from "@/lib/timezone";

export function CalendarNav({
  view,
  currentDate,
}: {
  view: "giorno" | "settimana";
  currentDate: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(nextView: string, nextDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    params.set("date", nextDate);
    router.push(`/calendario?${params.toString()}`);
  }

  function shift(days: number) {
    navigate(view, addDaysToKey(currentDate, days));
  }

  const step = view === "giorno" ? 1 : 7;
  // Vista settimana: intervallo da lunedì a domenica (es. "9 – 15 novembre 2026").
  const weekStart = addDaysToKey(currentDate, -(isoDow(currentDate) - 1));
  const weekEnd = addDaysToKey(weekStart, 6);
  const dateLabel =
    view === "giorno"
      ? formatDateKey(currentDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : `${formatDateKey(weekStart, { day: "numeric", month: weekStart.slice(5, 7) === weekEnd.slice(5, 7) ? undefined : "long" })} – ${formatDateKey(weekEnd, { day: "numeric", month: "long", year: "numeric" })}`;

  const navButton =
    "inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-lg border border-[var(--color-line)] px-3 text-sm text-[var(--color-ink)] hover:border-[var(--color-accent)]";

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => shift(-step)} aria-label={view === "giorno" ? "Giorno precedente" : "Settimana precedente"} className={navButton}>
          ←<span className="ml-1 hidden sm:inline">Indietro</span>
        </button>
        <button onClick={() => navigate(view, romeDateKey())} className={navButton}>
          Oggi
        </button>
        <button onClick={() => shift(step)} aria-label={view === "giorno" ? "Giorno successivo" : "Settimana successiva"} className={navButton}>
          <span className="mr-1 hidden sm:inline">Avanti</span>→
        </button>
        <span className="ml-1 text-[15px] font-medium capitalize text-[var(--color-ink)]">
          {dateLabel}
        </span>
      </div>

      <div className="flex w-fit items-center gap-1 rounded-lg border border-[var(--color-line)] p-1">
        <button
          onClick={() => navigate("giorno", currentDate)}
          aria-pressed={view === "giorno"}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "giorno"
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          Giorno
        </button>
        <button
          onClick={() => navigate("settimana", currentDate)}
          aria-pressed={view === "settimana"}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "settimana"
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          Settimana
        </button>
      </div>
    </div>
  );
}
