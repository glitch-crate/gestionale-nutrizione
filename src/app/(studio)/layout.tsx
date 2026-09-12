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
    userEmail = user?.email ?? null;
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
