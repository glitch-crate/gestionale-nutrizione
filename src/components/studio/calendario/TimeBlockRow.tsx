"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTimeBlockAction } from "@/lib/actions/studio/calendario";
import { capitalize, formatDayLong, formatTime } from "@/lib/format";
import { romeDateKey } from "@/lib/timezone";
import type { TimeBlock } from "@/types";

/** "09:00 – 19:00", oppure con le date se il blocco dura più giorni. */
function blockLabel(block: TimeBlock, showDay: boolean): string {
  // Un blocco che finisce a mezzanotte appartiene ancora al giorno di inizio.
  const lastInstant = new Date(new Date(block.endsAt).getTime() - 1);
  const sameDay = romeDateKey(new Date(block.startsAt)) === romeDateKey(lastInstant);
  if (!sameDay) {
    return `${capitalize(formatDayLong(block.startsAt))} ${formatTime(block.startsAt)} – ${formatDayLong(block.endsAt)} ${formatTime(block.endsAt)}`;
  }
  const range = `${formatTime(block.startsAt)} – ${formatTime(block.endsAt)}`;
  return showDay ? `${capitalize(formatDayLong(block.startsAt))}, ${range}` : range;
}

export function TimeBlockRow({ block, showDay = false }: { block: TimeBlock; showDay?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteTimeBlockAction(block.id);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-3 last:border-none">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-[var(--color-muted)]">
          Bloccato · {blockLabel(block, showDay)}
        </p>
        {block.reason ? (
          <p className="break-words text-sm text-[var(--color-muted)]">{block.reason}</p>
        ) : null}
        {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
      </div>
      {confirming ? (
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-[var(--color-ink)]">Rimuovere il blocco?</span>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-lg bg-[var(--color-status-cancelled)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "…" : "Sì, rimuovi"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="shrink-0 text-sm font-medium text-[var(--color-status-cancelled)] hover:underline"
        >
          Rimuovi
        </button>
      )}
    </div>
  );
}
