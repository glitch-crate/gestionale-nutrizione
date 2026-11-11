// Letture del portale cliente: appuntamenti e richieste di spostamento
// dell'utente autenticato. Il cliente non legge le tabelle direttamente:
// gli appuntamenti arrivano da una funzione del database che restituisce
// solo i suoi, senza le note interne dello studio.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus, RescheduleRequestStatus } from "@/types";

export type MyAppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  appointment_type_name: string | null;
};

export type MyRescheduleRequest = {
  id: string;
  appointment_id: string;
  old_starts_at: string;
  new_starts_at: string;
  status: RescheduleRequestStatus;
  expires_at: string;
  created_at: string;
};

export async function getMyAppointments(): Promise<MyAppointmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_my_appointments");
  return (data ?? []) as MyAppointmentRow[];
}

/** Richieste di spostamento del cliente (le policy restituiscono solo le sue). */
export async function getMyRescheduleRequests(): Promise<MyRescheduleRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reschedule_requests")
    .select("id, appointment_id, old_starts_at, new_starts_at, status, expires_at, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as MyRescheduleRequest[];
}
