"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfileAction } from "@/lib/actions/portale/profilo";

const INPUT_CLASS =
  "rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20";

export function ProfileForm({
  firstName,
  lastName,
  phone,
  email,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // onSubmit (non `action`): così, in caso di errore, i campi mantengono
  // quello che il cliente ha scritto invece di essere azzerati da React.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    const result = await updateMyProfileAction(new FormData(event.currentTarget));
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className="text-sm font-medium text-[var(--color-ink)]">
            Nome
          </label>
          <input id="firstName" name="firstName" required defaultValue={firstName} className={INPUT_CLASS} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className="text-sm font-medium text-[var(--color-ink)]">
            Cognome
          </label>
          <input id="lastName" name="lastName" required defaultValue={lastName} className={INPUT_CLASS} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-[var(--color-ink)]">
          Telefono
        </label>
        <input id="phone" name="phone" type="tel" required defaultValue={phone} className={INPUT_CLASS} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-[var(--color-ink)]">
          Email
        </label>
        <input
          id="email"
          disabled
          value={email}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-muted)]"
        />
        <p className="text-sm text-[var(--color-muted)]">
          Per cambiare l&apos;email di accesso, contatta direttamente lo studio.
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--color-status-cancelled)]">{error}</p> : null}
      {saved ? <p className="text-sm text-[var(--color-status-confirmed)]">Dati salvati.</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-fit rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {loading ? "Salvo…" : "Salva modifiche"}
      </button>
    </form>
  );
}
