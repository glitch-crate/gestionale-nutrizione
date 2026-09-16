import Link from "next/link";
import { PortaleLoginForm } from "@/components/portale/PortaleLoginForm";

export default async function PortaleLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8">
        <p className="font-[family-name:var(--font-display)] text-2xl italic text-[var(--color-ink)]">
          Studio Nutrizione
        </p>
        <p className="mt-1 mb-6 text-[15px] text-[var(--color-muted)]">
          Accedi per gestire i tuoi appuntamenti
        </p>

        {errore === "account_professionista" ? (
          <div className="mb-6 rounded-lg border border-[var(--color-status-pending)]/30 bg-[var(--color-status-pending-bg)] p-4">
            <p className="text-[15px] text-[var(--color-ink)]">
              Questo è l&apos;account del professionista, non un account cliente. Vai al{" "}
              <Link href="/login" className="font-medium underline">
                gestionale
              </Link>
              .
            </p>
          </div>
        ) : null}

        <PortaleLoginForm />
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Non hai un account?{" "}
          <Link
            href="/portale/registrati"
            className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          >
            Registrati
          </Link>
        </p>
      </div>
    </main>
  );
}
