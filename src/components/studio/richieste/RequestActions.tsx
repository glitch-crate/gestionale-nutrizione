"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveRescheduleAction } from "@/lib/actions/studio/richieste";

/** Evento ascoltato dal menu laterale per aggiornare subito il contatore. */
export const REQUESTS_CHANGED_EVENT = "richieste-aggiornate";

export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(approve: boolean) {
    setLoading(true);
    setError(null);
    const result = await resolveRescheduleAction(requestId, approve);
    setLoading(false);
    setConfirming(null);
    if (!result.success) {
      setError(result.error);
    }
    window.dispatchEvent(new Event(REQUESTS_CHANGED_EVENT));
    router.refresh();
  }

  // Approvare o rifiutare non si può disfare: chiediamo conferma.
  if (confirming) {
    const approve = confirming === "approve";
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[15px] text-[var(--color-ink)]">
          {approve
            ? "Approvare lo spostamento? L'appuntamento viene spostato subito al nuovo orario."
            : "Rifiutare lo spostamento? L'appuntamento resta all'orario attuale."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handle(approve)}
            disabled={loading}
            className={`min-h-[44px] rounded-lg px-4 py-2.5 text-[15px] font-medium text-white transition-colors disabled:opacity-50 ${
              approve
                ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                : "bg-[var(--color-status-cancelled)] hover:opacity-90"
            }`}
          >
            {loading ? (approve ? "Approvo…" : "Rifiuto…") : approve ? "Sì, approva" : "Sì, rifiuta"}
          </button>
          <button
            onClick={() => setConfirming(null)}
            disabled={loading}
            className="min-h-[44px] rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[15px] font-medium text-[var(--color-ink)] disabled:opacity-50"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setConfirming("approve")}
          className="min-h-[44px] rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          Approva
        </button>
        <button
          onClick={() => setConfirming("reject")}
          className="min-h-[44px] rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-status-cancelled)] hover:text-[var(--color-status-cancelled)]"
        >
          Rifiuta
        </button>
      </div>
      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
    </div>
  );
}
