import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
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
          Accedi al gestionale appuntamenti
        </p>

        {errore === "account_cliente" ? (
          <div className="mb-6 rounded-lg border border-[var(--color-status-pending)]/30 bg-[var(--color-status-pending-bg)] p-4">
            <p className="text-[15px] text-[var(--color-ink)]">
              Questo account è registrato come cliente, non come professionista. Se sei un
              cliente, vai al{" "}
              <Link href="/portale/login" className="font-medium underline">
                portale prenotazioni
              </Link>
              .
            </p>
          </div>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}
