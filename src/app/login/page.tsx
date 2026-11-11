import Link from "next/link";
import { AuthCard, authLinkClass } from "@/components/shared/AuthCard";
import { LoginForm } from "@/components/studio/auth/LoginForm";

// Accesso del professionista al gestionale.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;

  return (
    <AuthCard
      subtitle="Accedi al gestionale appuntamenti"
      notice={
        errore === "account_cliente" ? (
          <>
            Questo account è registrato come cliente, non come professionista. Se sei un cliente,
            vai al{" "}
            <Link href="/portale/login" className="font-medium underline">
              portale prenotazioni
            </Link>
            .
          </>
        ) : null
      }
      footer={
        <>
          Sei un cliente e vuoi prenotare un appuntamento?{" "}
          <Link href="/portale/registrati" className={authLinkClass}>
            Vai al portale prenotazioni
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
