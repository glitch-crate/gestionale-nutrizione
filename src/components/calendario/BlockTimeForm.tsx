"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTimeBlockAction } from "@/lib/actions/time-blocks";

export function BlockTimeForm({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createTimeBlockAction(formData);
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
        className="w-fit rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[15px] font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)]"
      >
        Blocca un orario
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-[var(--color-ink)]">
          Blocca un orario (es. impegno personale)
        </h2>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          Annulla
        </button>
      </div>
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="startsAt" className="text-sm font-medium text-[var(--color-ink)]">
              Da
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={`${defaultDate}T09:00`}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="endsAt" className="text-sm font-medium text-[var(--color-ink)]">
              A
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={`${defaultDate}T19:00`}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>
        <input
          name="reason"
          placeholder="Nota (facoltativa, solo per te — es. 'Impegno personale')"
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
        {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-fit rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          {loading ? "Salvo…" : "Blocca"}
        </button>
      </form>
    </div>
  );
}
