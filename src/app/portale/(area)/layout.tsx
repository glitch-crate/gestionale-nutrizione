import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function PortaleAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portale/login");
  }

  // Se chi ha aperto questo link è in realtà il professionista, non
  // dobbiamo MAI creargli automaticamente un profilo cliente.
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (professional) {
    redirect("/portale/login?errore=account_professionista");
  }

  // Al primo accesso (dopo la conferma email), questa chiamata crea il
  // profilo cliente usando i dati salvati in fase di registrazione. Se
  // esiste già, non fa nulla (è pensata per essere idempotente).
  const { data: client } = await supabase.rpc("ensure_client_profile");

  if (!client) {
    redirect("/portale/login?errore=account_non_cliente");
  }

  return (
    <div className="flex min-h-svh flex-col bg-[var(--color-canvas)]">
      <header className="flex h-16 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface)] px-6">
        <p className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-ink)]">
          Studio Nutrizione
        </p>
        <nav className="flex items-center gap-5">
          <Link
            href="/portale/prenota"
            className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Prenota
          </Link>
          <Link
            href="/portale/i-miei-appuntamenti"
            className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            I miei appuntamenti
          </Link>
          <LogoutButton redirectTo="/portale/login" />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
