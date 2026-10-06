"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordField } from "@/components/ui/PasswordField";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  function startCooldown() {
    setCooldown(20);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    // Non serve più indicare redirectTo: non useremo il link dell'email,
    // solo il codice numerico che l'email contiene comunque.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);
    startCooldown();

    if (resetError) {
      const isRateLimited =
        resetError.status === 429 ||
        resetError.code === "over_email_send_rate_limit" ||
        resetError.message.toLowerCase().includes("second");

      setError(
        isRateLimited
          ? "Hai già richiesto un codice da poco: controlla la posta (potrebbe essere già arrivato), oppure aspetta circa un minuto prima di riprovare."
          : "Non è stato possibile inviare l'email. Riprova.",
      );
      return;
    }

    setStep("code");
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "recovery",
    });

    if (verifyError) {
      setLoading(false);
      setError(
        "Codice non corretto o scaduto (i codici durano pochi minuti). Controlla di averlo copiato bene, oppure richiedine uno nuovo.",
      );
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError("Non è stato possibile aggiornare la password. Riprova.");
      return;
    }

    router.replace("/portale/prenota");
    router.refresh();
  }

  if (step === "code") {
    return (
      <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
        <div className="rounded-lg border border-[var(--color-status-confirmed)]/30 bg-[var(--color-status-confirmed-bg)] p-4">
          <p className="text-[15px] text-[var(--color-ink)]">
            Ti abbiamo mandato un&apos;email a <strong>{email}</strong> con un codice a 6 cifre.
            Inseriscilo qui sotto insieme alla nuova password.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-medium text-[var(--color-ink)]">
            Codice ricevuto via email
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] tracking-widest text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-sm font-medium text-[var(--color-ink)]">
            Nuova password
          </label>
          <PasswordField
            id="newPassword"
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
          {loading ? "Verifico…" : "Imposta nuova password"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("email");
            setError(null);
          }}
          className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Cambia email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="flex flex-col gap-4">
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
        disabled={loading || cooldown > 0}
        className="mt-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {loading
          ? "Invio in corso…"
          : cooldown > 0
            ? `Riprova tra ${cooldown}s`
            : "Invia codice"}
      </button>
    </form>
  );
}
