"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/lib/actions/studio/clienti";

export function NewClientForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createClientAction(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    formRef.current?.reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
      >
        + Nuovo cliente
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-[var(--color-ink)]">Nuovo cliente</h2>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          Annulla
        </button>
      </div>
      <form ref={formRef} action={handleSubmit} className="grid grid-cols-2 gap-3">
        <input
          name="firstName"
          required
          placeholder="Nome"
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
        <input
          name="lastName"
          required
          placeholder="Cognome"
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
        <input
          name="phone"
          required
          placeholder="Telefono"
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
        <textarea
          name="notes"
          placeholder="Note operative (facoltative)"
          rows={2}
          className="col-span-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
        {error ? (
          <p className="col-span-2 text-sm text-[var(--color-status-cancelled)]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="col-span-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          {loading ? "Salvo…" : "Salva cliente"}
        </button>
      </form>
    </div>
  );
}
