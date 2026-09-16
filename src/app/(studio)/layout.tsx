import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
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

  return (
    <div className="flex h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto bg-[var(--color-canvas)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
