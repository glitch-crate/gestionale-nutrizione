"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Il link dell'email può arrivare con un errore (scaduto, già usato,
  // non valido) sia nella query string sia nel frammento #: lo
  // controlliamo subito, invece di restare bloccati su "verifica in
  // corso" all'infinito.
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);
    const errorCode = hashParams.get("error_code") || searchParams.get("error_code");

    if (errorCode === "otp_expired") {
      setLinkError(
        "Questo link non è più valido: è scaduto oppure è già stato usato (a volte succede se l'app email lo apre in automatico per un controllo di sicurezza, prima che tu riesca a cliccarlo tu stesso).",
      );
      return;
    }
    if (errorCode) {
      setLinkError("Questo link non è valido. Richiedine uno nuovo dalla pagina di login.");
      return;
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError("Non è stato possibile aggiornare la password. Riprova.");
      return;
    }

    router.replace("/portale/prenota");
    router.refresh();
  }

  if (linkError) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-[var(--color-status-cancelled)]/30 bg-[var(--color-status-cancelled-bg)] p-4">
          <p className="text-[15px] text-[var(--color-ink)]">{linkError}</p>
        </div>
        <Link
          href="/portale/password-dimenticata"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-center text-[15px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Richiedi un nuovo link
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <p className="text-[15px] text-[var(--color-muted)]">Verifica del link in corso…</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-[var(--color-ink)]">
          Nuova password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          placeholder="Almeno 8 caratteri"
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
        {loading ? "Salvo…" : "Imposta nuova password"}
      </button>
    </form>
  );
}
