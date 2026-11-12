"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateClientAction } from "@/lib/actions/studio/clienti";
import type { Client } from "@/types";

const INPUT_CLASS =
  "rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]";

/** Pulsante "Modifica dati" che apre il modulo per correggere la scheda cliente. */
export function EditClientForm({ client, hasPortalAccount }: { client: Client; hasPortalAccount: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await updateClientAction(client.id, new FormData(event.currentTarget));
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit text-sm font-medium text-[var(--color-ink)] hover:underline"
      >
        Modifica dati
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-[var(--color-ink)]">Modifica dati</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          Annulla
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-ink)]">
          Nome
          <input name="firstName" required defaultValue={client.firstName} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-ink)]">
          Cognome
          <input name="lastName" required defaultValue={client.lastName} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-ink)]">
          Telefono
          <input name="phone" type="tel" required defaultValue={client.phone} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-ink)]">
          Email
          <input name="email" type="email" required defaultValue={client.email} className={INPUT_CLASS} />
        </label>
      </div>
      {hasPortalAccount ? (
        <p className="text-sm text-[var(--color-muted)]">
          Questo cliente accede al portale: cambiare l&apos;email qui aggiorna solo la scheda (e dove
          arrivano le email), non l&apos;email con cui entra nel portale.
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-ink)]">
        Note operative (facoltative)
        <textarea name="notes" rows={2} defaultValue={client.notes ?? ""} className={INPUT_CLASS} />
      </label>
      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {loading ? "Salvo…" : "Salva modifiche"}
      </button>
    </form>
  );
}
