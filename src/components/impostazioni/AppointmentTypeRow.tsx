"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateAppointmentTypeDurationAction } from "@/lib/actions/settings";

export function AppointmentTypeRow({
  id,
  name,
  durationMinutes,
}: {
  id: string;
  name: string;
  durationMinutes: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(durationMinutes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSaved(false);
    const result = await updateAppointmentTypeDurationAction(id, value);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  const changed = value !== durationMinutes;

  return (
    <div className="flex items-center justify-between gap-3 text-[15px]">
      <span className="text-[var(--color-ink)]">{name}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={5}
          max={240}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-20 rounded-md border border-[var(--color-line)] bg-[var(--color-canvas)] px-2 py-1.5 text-right text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
        <span className="text-sm text-[var(--color-muted)]">min</span>
        {changed ? (
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            {loading ? "Salvo…" : "Salva"}
          </button>
        ) : saved ? (
          <span className="text-sm text-[var(--color-status-confirmed)]">Salvato ✓</span>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
    </div>
  );
}
