// Letture fatte dal browser nel portale clienti (orari liberi, opzioni di
// prenotazione). Le scritture (prenotare, spostare) passano invece dalle
// server action in lib/actions/portale, che inviano anche le email.
// Il cliente non accede alle tabelle: usa solo le funzioni RPC definite in
// supabase/schema.sql, che controllano permessi e regole di prenotazione.
// Ogni funzione restituisce { data, error } come il client Supabase.
import { createClient } from "@/lib/supabase/client";

export type SlotRow = {
  slot_start: string;
  slot_end: string;
  duration_minutes: number;
  appointment_type_name: string;
};

/** Orari prenotabili per un tipo di visita tra due date "YYYY-MM-DD". */
export function fetchAvailableSlots(params: { p_type_name: string | null; p_from: string; p_to: string }) {
  return createClient().rpc("get_available_slots", params);
}

/** Tipi di visita che il cliente può prenotare (dal più breve). */
export function fetchBookingOptions() {
  return createClient().rpc("get_booking_options");
}

/** Appuntamento già in programma che impedisce di prenotarne un altro. */
export function fetchBookingLock() {
  return createClient().rpc("get_booking_lock");
}

/** Orari liberi per spostare un appuntamento, tra due date "YYYY-MM-DD". */
export function fetchRescheduleSlots(params: { p_appointment_id: string; p_from: string; p_to: string }) {
  return createClient().rpc("get_reschedule_slots", params);
}
