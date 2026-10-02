"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTimeBlockAction } from "@/lib/actions/time-blocks";
import type { TimeBlock } from "@/lib/queries";

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const time = (d: Date) => d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  return `${time(start)} – ${time(end)}`;
}

export function TimeBlockRow({ block }: { block: TimeBlock }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteTimeBlockAction(block.id);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-3 last:border-none">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-[var(--color-muted)]">
          Bloccato · {formatRange(block.startsAt, block.endsAt)}
        </p>
        {block.reason ? (
          <p className="break-words text-sm text-[var(--color-muted)]">{block.reason}</p>
        ) : null}
      </div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="shrink-0 text-sm font-medium text-[var(--color-status-cancelled)] hover:underline disabled:opacity-60"
      >
        {loading ? "…" : "Rimuovi"}
      </button>
    </div>
  );
}
