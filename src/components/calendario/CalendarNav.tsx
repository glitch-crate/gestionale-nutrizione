"use client";

import { useRouter, useSearchParams } from "next/navigation";

function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

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
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    navigate(view, toDateParam(d));
  }

  const step = view === "giorno" ? 1 : 7;
  const dateLabel = new Date(currentDate).toLocaleDateString("it-IT", {
    weekday: view === "giorno" ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => shift(-step)}
          className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink)] hover:border-[var(--color-accent)]"
        >
          ← Indietro
        </button>
        <button
          onClick={() => navigate(view, toDateParam(new Date()))}
          className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink)] hover:border-[var(--color-accent)]"
        >
          Oggi
        </button>
        <button
          onClick={() => shift(step)}
          className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink)] hover:border-[var(--color-accent)]"
        >
          Avanti →
        </button>
        <span className="ml-2 text-[15px] font-medium capitalize text-[var(--color-ink)]">
          {dateLabel}
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] p-1">
        <button
          onClick={() => navigate("giorno", currentDate)}
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
