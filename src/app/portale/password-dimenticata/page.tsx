import Link from "next/link";
import { ForgotPasswordForm } from "@/components/portale/ForgotPasswordForm";

export default function PasswordDimenticataPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8">
        <p className="font-[family-name:var(--font-display)] text-2xl italic text-[var(--color-ink)]">
          Studio Nutrizione
        </p>
        <p className="mt-1 mb-6 text-[15px] text-[var(--color-muted)]">
          Inserisci la tua email per reimpostare la password
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          <Link
            href="/portale/login"
            className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          >
            Torna al login
          </Link>
        </p>
      </div>
    </main>
  );
}
