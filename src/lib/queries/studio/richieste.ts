// Letture delle richieste di spostamento fatte dai clienti.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { RescheduleRequestStatus } from "@/types";

export type StudioRescheduleRequest = {
  id: string;
  old_starts_at: string;
  new_starts_at: string;
  expires_at: string;
  status: RescheduleRequestStatus;
  resolved_at: string | null;
  clients: { first_name: string; last_name: string; phone: string } | null;
  appointments: { appointment_types: { name: string } | null } | null;
};

const REQUEST_SELECT =
  "id, old_starts_at, new_starts_at, expires_at, status, resolved_at, clients(first_name, last_name, phone), appointments(appointment_types(name))";

/** Richieste ancora da gestire (in attesa e non scadute), dalla più vecchia. */
export async function getPendingRescheduleRequests(): Promise<StudioRescheduleRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reschedule_requests")
    .select(REQUEST_SELECT)
    .eq("status", "in_attesa")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as StudioRescheduleRequest[];
}

/** Ultime richieste approvate o rifiutate. */
export async function getRecentlyResolvedRescheduleRequests(limit = 10): Promise<StudioRescheduleRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reschedule_requests")
    .select(REQUEST_SELECT)
    .in("status", ["approvata", "rifiutata"])
    .order("resolved_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as StudioRescheduleRequest[];
}

/** Quante richieste aspettano una risposta. */
export async function countPendingRescheduleRequests(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("reschedule_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "in_attesa")
    .gt("expires_at", new Date().toISOString());
  return count ?? 0;
}
