"use client";

import { useState } from "react";
import { PrivacyModal } from "@/components/portale/PrivacyModal";
import { PasswordField } from "@/components/ui/PasswordField";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isExistingClient, setIsExistingClient] = useState<boolean | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (isExistingClient === null) {
      setError("Indica se sei già cliente dello studio.");
      return;
    }

    if (!privacyAccepted) {
      setError("Devi accettare l'informativa privacy per registrarti.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          privacy_accepted: true,
          is_existing_client: isExistingClient,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "Esiste già un account con questa email."
          : "Non è stato possibile creare l'account. Riprova.",
      );
      return;
    }

    // Se la conferma email è richiesta, non c'è ancora una sessione
    // attiva: il profilo cliente verrà creato automaticamente al primo
    // accesso, dopo che avrà cliccato il link ricevuto via email.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    const { error: rpcError } = await supabase.rpc("ensure_client_profile");
    if (rpcError) {
      setError("Account creato, ma non è stato possibile completare la registrazione. Contatta lo studio.");
      return;
    }

    router.replace("/portale/prenota");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="rounded-lg border border-[var(--color-status-confirmed)]/30 bg-[var(--color-status-confirmed-bg)] p-4">
        <p className="text-[15px] font-medium text-[var(--color-status-confirmed)]">
          Controlla la tua email
        </p>
        <p className="mt-1.5 text-[15px] text-[var(--color-ink)]">
          Ti abbiamo inviato un link di conferma a {email}. Cliccalo, poi torna qui e accedi.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className="text-sm font-medium text-[var(--color-ink)]">
            Nome
          </label>
          <input
            id="firstName"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className="text-sm font-medium text-[var(--color-ink)]">
            Cognome
          </label>
          <input
            id="lastName"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-[var(--color-ink)]">
          Telefono
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          placeholder="+39 333 1234567"
        />
      </div>

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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-[var(--color-ink)]">
          Password
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

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          Sei già cliente dello studio?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsExistingClient(true)}
            className={`min-h-[44px] rounded-lg border px-3.5 py-2.5 text-[15px] font-medium transition-colors ${
              isExistingClient === true
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent)]"
            }`}
          >
            Sì, sono già cliente
          </button>
          <button
            type="button"
            onClick={() => setIsExistingClient(false)}
            className={`min-h-[44px] rounded-lg border px-3.5 py-2.5 text-[15px] font-medium transition-colors ${
              isExistingClient === false
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent)]"
            }`}
          >
            No, sono nuovo
          </button>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-[var(--color-ink)]">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          className="mt-0.5 accent-[var(--color-accent)]"
        />
        <span>
          Ho letto e accetto l&apos;{" "}
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="font-medium underline"
          >
            informativa privacy
          </button>
          .
        </span>
      </label>

      {showPrivacyModal ? (
        <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
      ) : null}

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
        {loading ? "Registrazione in corso…" : "Crea account"}
      </button>
    </form>
  );
}
