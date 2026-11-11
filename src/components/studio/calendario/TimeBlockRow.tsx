"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTimeBlockAction } from "@/lib/actions/studio/calendario";
import { formatTimeRange } from "@/lib/format";
import type { TimeBlock } from "@/types";

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
          Bloccato · {formatTimeRange(block.startsAt, block.endsAt)}
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
