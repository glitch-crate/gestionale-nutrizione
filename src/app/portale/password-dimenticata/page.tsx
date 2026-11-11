import Link from "next/link";
import { AuthCard, authLinkClass } from "@/components/shared/AuthCard";
import { ForgotPasswordForm } from "@/components/portale/auth/ForgotPasswordForm";

export default function PasswordDimenticataPage() {
  return (
    <AuthCard
      subtitle="Inserisci la tua email per reimpostare la password"
      footer={
        <Link href="/portale/login" className={authLinkClass}>
          Torna al login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
