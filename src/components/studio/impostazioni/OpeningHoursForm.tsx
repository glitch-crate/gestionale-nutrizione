"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOpeningHoursAction } from "@/lib/actions/studio/impostazioni";
import { WEEK_DAYS as DAYS } from "@/lib/format";
import type { OpeningHours } from "@/types";

const TIME_INPUT =
  "min-h-[40px] rounded-md border border-[var(--color-line)] bg-[var(--color-canvas)] px-2 py-1.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]";

export function OpeningHoursForm({
  businessName,
  openingHours,
}: {
  businessName: string;
  openingHours: OpeningHours;
}) {
  const router = useRouter();
  const [closedDays, setClosedDays] = useState<Record<string, boolean>>(
    Object.fromEntries(DAYS.map((d) => [d.key, (openingHours[d.key] ?? []).length === 0])),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // onSubmit (non `action`): in caso di errore i campi mantengono quello che
  // è stato scritto, invece di essere azzerati da React.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    setSaved(false);
    const result = await updateOpeningHoursAction(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="businessName" className="text-sm font-medium text-[var(--color-ink)]">
          Nome studio
        </label>
        <input
          id="businessName"
          name="businessName"
          defaultValue={businessName}
          required
          className="w-full max-w-sm rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="flex flex-col gap-3">
        {DAYS.map((day) => {
          const windows = openingHours[day.key] ?? [];
          const isClosed = closedDays[day.key];

          return (
            <div key={day.key} className="flex flex-col gap-3 border-b border-[var(--color-line)] pb-3 last:border-none xl:flex-row xl:items-center">
              <div className="flex w-44 shrink-0 items-center justify-between gap-2">
                <span className="text-[15px] font-medium text-[var(--color-ink)]">{day.label}</span>
                <label className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
                  <input
                    type="checkbox"
                    name={`closed_${day.key}`}
                    checked={isClosed}
                    onChange={(e) =>
                      setClosedDays((prev) => ({ ...prev, [day.key]: e.target.checked }))
                    }
                    className="accent-[var(--color-accent)]"
                  />
                  Chiuso
                </label>
              </div>

              {!isClosed ? (
                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                  {[1, 2].map((slot) => (
                    <div key={slot} className="flex flex-wrap items-center gap-2">
                      <span className="w-full text-[var(--color-muted)] sm:w-auto">
                        {slot === 1 ? "Fascia" : "2ª fascia (facoltativa)"}
                      </span>
                      <input
                        type="time"
                        name={`start_${day.key}_${slot}`}
                        aria-label={`${day.label}, inizio ${slot === 1 ? "prima" : "seconda"} fascia`}
                        defaultValue={windows[slot - 1]?.start ?? ""}
                        className={TIME_INPUT}
                      />
                      <span className="text-[var(--color-muted)]">–</span>
                      <input
                        type="time"
                        name={`end_${day.key}_${slot}`}
                        aria-label={`${day.label}, fine ${slot === 1 ? "prima" : "seconda"} fascia`}
                        defaultValue={windows[slot - 1]?.end ?? ""}
                        className={TIME_INPUT}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
      {saved ? <p className="text-sm text-[var(--color-status-confirmed)]">Orari salvati.</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {loading ? "Salvo…" : "Salva orari"}
      </button>
    </form>
  );
}
