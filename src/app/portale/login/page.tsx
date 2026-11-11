import Link from "next/link";
import { AuthCard, authLinkClass } from "@/components/shared/AuthCard";
import { PortaleLoginForm } from "@/components/portale/auth/PortaleLoginForm";
import { StudioContactLinks } from "@/components/portale/layout/StudioContacts";

// Accesso dei clienti al portale prenotazioni.
export default async function PortaleLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;

  const notice =
    errore === "account_professionista" ? (
      <>
        Questo è l&apos;account del professionista, non un account cliente. Vai al{" "}
        <Link href="/login" className="font-medium underline">
          gestionale
        </Link>
        .
      </>
    ) : errore === "account_non_cliente" ? (
      <>
        Non è stato possibile collegare questo account a una scheda cliente. Contatta lo studio:{" "}
        <StudioContactLinks />
      </>
    ) : null;

  return (
    <AuthCard
      subtitle="Accedi per gestire i tuoi appuntamenti"
      notice={notice}
      footer={
        <>
          Non hai un account?{" "}
          <Link href="/portale/registrati" className={authLinkClass}>
            Registrati
          </Link>
        </>
      }
    >
      <PortaleLoginForm />
    </AuthCard>
  );
}
