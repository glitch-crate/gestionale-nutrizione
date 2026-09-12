import { createBrowserClient } from "@supabase/ssr";

// Usato nei Client Component (es. form di login, logout).
// Le chiavi arrivano da variabili d'ambiente pubbliche (NEXT_PUBLIC_*):
// la anon key è progettata per essere esposta al browser, la sicurezza
// vera è garantita dalle policy di Row Level Security nel database,
// non dal nasconderla.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
