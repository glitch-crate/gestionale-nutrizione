import { redirect } from "next/navigation";
import { PortaleHeader } from "@/components/portale/layout/PortaleHeader";
import { PortaleFooter } from "@/components/portale/layout/StudioContacts";
import { ensureClientProfile, getCurrentUser } from "@/lib/auth/session";

// Layout delle pagine riservate del portale: solo i clienti possono vederle.
export default async function PortaleAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In parallelo: chi è l'utente e la sua scheda cliente. La funzione del
  // database non crea mai una scheda per un professionista (restituisce null),
  // quindi è sicuro chiamarla prima di sapere se lo è.
  const [{ user, professional }, client] = await Promise.all([
    getCurrentUser(),
    ensureClientProfile(),
  ]);

  if (!user) {
    redirect("/portale/login");
  }

  // Il professionista non deve MAI ricevere automaticamente un profilo cliente.
  // /esci lo disconnette e lo rimanda al login del portale con l'avviso.
  if (professional) {
    redirect("/esci?motivo=account_professionista");
  }

  if (!client) {
    redirect("/portale/login?errore=account_non_cliente");
  }

  return (
    <div className="flex min-h-svh flex-col bg-[var(--color-canvas)]">
      <PortaleHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-[22px] py-6 sm:px-6 sm:py-8">{children}</main>
      <PortaleFooter />
    </div>
  );
}
