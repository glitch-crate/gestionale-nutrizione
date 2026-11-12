"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordField } from "@/components/shared/PasswordField";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Controlliamo subito se il link porta un errore noto, ma NON
  // "consumiamo" il codice di recupero finché l'utente non clicca
  // davvero un pulsante: così un'apertura automatica del link (es. per
  // generare un'anteprima, fatta da alcune app di posta) non lo brucia
  // prima che la persona vera possa usarlo.
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);
    const errorCode = hashParams.get("error_code") || searchParams.get("error_code");

    // Gli aggiornamenti di stato partono in un microtask, non direttamente
    // nel corpo dell'effetto (evita un secondo render a cascata).
    if (errorCode === "otp_expired") {
      queueMicrotask(() =>
        setLinkError(
          "Questo link non è più valido: è scaduto oppure è già stato usato (a volte succede se l'app email lo apre in automatico per un controllo di sicurezza, prima che tu riesca a cliccarlo tu stesso).",
        ),
      );
      return;
    }
    if (errorCode) {
      queueMicrotask(() => setLinkError("Questo link non è valido. Richiedine uno nuovo dalla pagina di login."));
      return;
    }

    const code = searchParams.get("code");
    if (code) {
      queueMicrotask(() => setPendingCode(code));
      return;
    }

    // Flusso alternativo (token già nel frammento #): qui Supabase lo
    // rileva da solo, non c'è un "codice" da scambiare esplicitamente.
    const supabase = createClient("portale");

    const timeout = setTimeout(() => {
      setLinkError(
        "Non siamo riusciti a verificare questo link. Prova a richiederne uno nuovo dalla pagina di login.",
      );
    }, 8000);

    function markReady() {
      clearTimeout(timeout);
      setReady(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        markReady();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleConfirmLink() {
    if (!pendingCode) return;
    setConfirming(true);
    setError(null);

    const supabase = createClient("portale");
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(pendingCode);

    setConfirming(false);

    if (exchangeError) {
      setLinkError(
        "Questo link non è più valido: è scaduto oppure è già stato usato. Richiedine uno nuovo.",
      );
      return;
    }

    setReady(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient("portale");
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

  if (pendingCode && !ready) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[15px] text-[var(--color-ink)]">
          Clicca qui sotto per confermare che sei tu e continuare.
        </p>
        <button
          onClick={handleConfirmLink}
          disabled={confirming}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          {confirming ? "Verifica in corso…" : "Continua"}
        </button>
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
        <PasswordField
          id="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
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
