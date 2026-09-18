import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;

  // Se Supabase non è ancora configurato, mostriamo comunque la UI con
  // dati mock (utile durante lo sviluppo prima dello STEP 5/6).
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Un cliente che per errore ha fatto login da qui (invece che dal
      // portale) non deve mai vedere quest'area: lo rimandiamo indietro.
      const { data: professional } = await supabase
        .from("professionals")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!professional) {
        await supabase.auth.signOut();
        redirect("/login?errore=account_cliente");
      }

      userEmail = user.email ?? null;
    }
  }

  return <AppShell userEmail={userEmail}>{children}</AppShell>;
}
