import Link from "next/link";
import { PortaleLoginForm } from "@/components/portale/PortaleLoginForm";

export default function PortaleLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8">
        <p className="font-[family-name:var(--font-display)] text-2xl italic text-[var(--color-ink)]">
          Studio Nutrizione
        </p>
        <p className="mt-1 mb-8 text-[15px] text-[var(--color-muted)]">
          Accedi per gestire i tuoi appuntamenti
        </p>
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
