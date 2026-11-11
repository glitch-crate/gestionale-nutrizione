import Link from "next/link";
import { AuthCard, authLinkClass } from "@/components/shared/AuthCard";
import { RegisterForm } from "@/components/portale/auth/RegisterForm";

export default function RegistratiPage() {
  return (
    <AuthCard
      subtitle="Crea il tuo account per prenotare i tuoi appuntamenti"
      footer={
        <>
          Hai già un account?{" "}
          <Link href="/portale/login" className={authLinkClass}>
            Accedi
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
