"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({
  redirectTo = "/login",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
    >
      Esci
    </button>
  );
}
