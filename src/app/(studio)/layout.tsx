import { redirect } from "next/navigation";
import { AppShell } from "@/components/studio/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/session";

// Layout dell'area studio: solo il professionista può vederla.
// (Gli utenti non autenticati sono già rimandati al login da src/proxy.ts.)
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In sviluppo, senza Supabase configurato, si vede l'interfaccia vuota;
  // in produzione no.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (process.env.NODE_ENV === "production") redirect("/login");
    return <AppShell userEmail={null} professionalName={null}>{children}</AppShell>;
  }

  const { user, professional } = await getCurrentUser();

  // Un cliente che ha fatto login da qui invece che dal portale non deve
  // vedere quest'area: /esci lo disconnette e lo rimanda indietro.
  if (user && !professional) {
    redirect("/esci?motivo=account_cliente");
  }

  return (
    <AppShell userEmail={user?.email ?? null} professionalName={professional?.full_name ?? null}>
      {children}
    </AppShell>
  );
}
