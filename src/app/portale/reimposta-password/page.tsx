import { AuthCard } from "@/components/shared/AuthCard";
import { ResetPasswordForm } from "@/components/portale/auth/ResetPasswordForm";

export default function ReimpostaPasswordPage() {
  return (
    <AuthCard subtitle="Scegli la tua nuova password">
      <ResetPasswordForm />
    </AuthCard>
  );
}
