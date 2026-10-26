"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveRescheduleAction } from "@/lib/actions/reschedule";

export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(approve: boolean) {
    setLoading(approve ? "approve" : "reject");
    setError(null);
    const result = await resolveRescheduleAction(requestId, approve);
    setLoading(null);
    if (!result.success) {
      setError(result.error);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handle(true)}
          disabled={loading !== null}
          className="min-h-[44px] rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {loading === "approve" ? "Approvo…" : "Approva"}
        </button>
        <button
          onClick={() => handle(false)}
          disabled={loading !== null}
          className="min-h-[44px] rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-status-cancelled)] hover:text-[var(--color-status-cancelled)] disabled:opacity-50"
        >
          {loading === "reject" ? "Rifiuto…" : "Rifiuta"}
        </button>
      </div>
      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
    </div>
  );
}
