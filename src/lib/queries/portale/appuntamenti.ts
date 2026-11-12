// Letture del portale cliente: appuntamenti e richieste di spostamento
// dell'utente autenticato.
//
// Il database di produzione non ha la funzione `get_my_appointments`: il
// cliente legge `appointments` direttamente, e la policy RLS
// `appointments_select_own_client` gli restituisce solo i suoi. Non
// selezioniamo mai `notes`, che sono le note interne dello studio.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getMyClientProfile } from "@/lib/queries/portale/profilo";
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

/** Appuntamenti del cliente collegato, dal più recente. */
export async function getMyAppointments(): Promise<MyAppointmentRow[]> {
  const profile = await getMyClientProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, appointment_types(name)")
    .eq("client_id", profile.id)
    .order("starts_at", { ascending: false });

  if (error) console.error("getMyAppointments", error.message);

  const rows = (data ?? []) as unknown as {
    id: string;
    starts_at: string;
    ends_at: string;
    status: AppointmentStatus;
    appointment_types: { name: string } | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status,
    appointment_type_name: row.appointment_types?.name ?? null,
  }));
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
