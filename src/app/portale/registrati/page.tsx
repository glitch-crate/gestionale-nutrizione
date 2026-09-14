import Link from "next/link";
import { RegisterForm } from "@/components/portale/RegisterForm";

export default function RegistratiPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-canvas)] px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8">
        <p className="font-[family-name:var(--font-display)] text-2xl italic text-[var(--color-ink)]">
          Studio Nutrizione
        </p>
        <p className="mt-1 mb-8 text-[15px] text-[var(--color-muted)]">
          Crea il tuo account per prenotare i tuoi appuntamenti
        </p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Hai già un account?{" "}
          <Link
            href="/portale/login"
            className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          >
            Accedi
          </Link>
        </p>
      </div>
    </main>
  );
}
