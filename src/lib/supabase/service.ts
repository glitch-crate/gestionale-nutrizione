import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ATTENZIONE: usa la chiave "service role", che ignora completamente le
// policy di Row Level Security. Va importato solo da codice che gira
// esclusivamente sul server (es. route API), mai da Client Component o
// da codice che finisce nel bundle inviato al browser.
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Variabili d'ambiente Supabase (service role) mancanti");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
