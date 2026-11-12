// Chiamate al database fatte dal browser nell'area studio.
import { createClient } from "@/lib/supabase/client";

/**
 * Quante richieste di spostamento aspettano una risposta. Usata dal menu
 * laterale, che si aggiorna da solo ogni minuto (lato server la stessa
 * lettura è countPendingRescheduleRequests in lib/queries/studio/richieste.ts).
 */
export async function fetchPendingRequestsCount(): Promise<number> {
  const { count } = await createClient("studio")
    .from("reschedule_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "in_attesa")
    .gt("expires_at", new Date().toISOString());
  return count ?? 0;
}
