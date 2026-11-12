import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { areaForRequest, authCookieName, type Area } from "@/lib/supabase/area";

// Usato nei Client Component (es. form di login, logout).
// Le chiavi arrivano da variabili d'ambiente pubbliche (NEXT_PUBLIC_*):
// la anon key è progettata per essere esposta al browser, la sicurezza
// vera è garantita dalle policy di Row Level Security nel database,
// non dal nasconderla.
//
// Un client per area (studio, portale), ognuno con il proprio cookie di
// sessione: l'area si ricava dalla pagina in cui ci si trova.
const clients: Partial<Record<Area, SupabaseClient>> = {};

export function createClient(area?: Area) {
  const resolved: Area =
    area ?? (typeof window === "undefined" ? "studio" : areaForRequest(window.location.pathname));

  if (!clients[resolved]) {
    clients[resolved] = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookieOptions: { name: authCookieName(resolved) }, isSingleton: false },
    );
  }
  return clients[resolved]!;
}
