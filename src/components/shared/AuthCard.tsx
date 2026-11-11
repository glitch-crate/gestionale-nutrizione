import { STUDIO } from "@/config/studio";

// Riquadro centrato delle pagine di accesso (login, registrazione,
// recupero password), con il nome dello studio e un sottotitolo.
export function AuthCard({
  subtitle,
  notice,
  footer,
  children,
}: {
  subtitle: string;
  /** Avviso opzionale mostrato sopra il form (es. account sbagliato). */
  notice?: React.ReactNode;
  /** Link opzionali sotto il form. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-canvas)] px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8">
        <p className="font-display text-2xl text-[var(--color-ink)]">
          {STUDIO.name}
        </p>
        <p className="mt-1 mb-6 text-[15px] text-[var(--color-muted)]">{subtitle}</p>

        {notice ? (
          <div className="mb-6 rounded-lg border border-[var(--color-status-pending)]/30 bg-[var(--color-status-pending-bg)] p-4">
            <p className="text-[15px] text-[var(--color-ink)]">{notice}</p>
          </div>
        ) : null}

        {children}

        {footer ? <p className="mt-6 text-center text-sm text-[var(--color-muted)]">{footer}</p> : null}
      </div>
    </main>
  );
}

/** Link in stile accento, usato nei footer delle pagine di accesso. */
export const authLinkClass =
  "font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]";
