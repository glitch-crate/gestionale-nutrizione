"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClientAction } from "@/lib/actions/studio/clienti";

export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteClientAction(clientId);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/clienti");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-[var(--color-status-cancelled)] hover:underline"
      >
        Elimina cliente
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 rounded-lg border border-[var(--color-status-cancelled)]/30 bg-[var(--color-status-cancelled-bg)] p-3">
      <p className="text-sm text-[var(--color-ink)]">
        Eliminare <strong>{clientName}</strong> e tutti i suoi appuntamenti? Non si può annullare.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setConfirming(false)}
          className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          Annulla
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg bg-[var(--color-status-cancelled)] px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Elimino…" : "Sì, elimina"}
        </button>
      </div>
      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
    </div>
  );
}
