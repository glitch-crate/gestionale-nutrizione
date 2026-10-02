"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portale/reimposta-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(
        resetError.message.toLowerCase().includes("seconds")
          ? "Hai già richiesto un link da poco: controlla la posta (potrebbe essere già arrivato), oppure aspetta circa un minuto prima di riprovare."
          : "Non è stato possibile inviare l'email. Riprova.",
      );
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-[var(--color-status-confirmed)]/30 bg-[var(--color-status-confirmed-bg)] p-4">
        <p className="text-[15px] font-medium text-[var(--color-status-confirmed)]">
          Controlla la tua email
        </p>
        <p className="mt-1.5 text-[15px] text-[var(--color-ink)]">
          Se esiste un account con l&apos;indirizzo {email}, riceverai un link per reimpostare la
          password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-[var(--color-ink)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-status-cancelled)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {loading ? "Invio in corso…" : "Invia link di reset"}
      </button>
    </form>
  );
}
