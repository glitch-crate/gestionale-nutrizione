// Letture per l'agenda dello studio: appuntamenti, tipi di visita, orari liberi.
import "server-only";
import {
  addDaysToKey,
  romeDateKey,
  romeDayStart,
  romeDayEnd,
  isoDow as isoDowOf,
  computeFreeSlots,
  toRomeInputValue,
} from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";
import type { Appointment, AppointmentStatus, OpeningHours } from "@/types";

type AppointmentRow = {
  id: string;
  studio_id: string;
  client_id: string;
  appointment_type_id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  created_by: "professionista" | "cliente";
  clients: { first_name: string; last_name: string } | null;
  appointment_types: { name: string; duration_minutes: number } | null;
};

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    studioId: row.studio_id,
    clientId: row.client_id,
    appointmentTypeId: row.appointment_type_id,
    professionalId: row.professional_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    clientName: row.clients ? `${row.clients.first_name} ${row.clients.last_name}` : undefined,
    appointmentTypeName: row.appointment_types?.name,
  };
}

const APPOINTMENT_SELECT =
  "id, studio_id, client_id, appointment_type_id, professional_id, starts_at, ends_at, status, notes, created_at, created_by, clients(first_name, last_name), appointment_types(name, duration_minutes)";

export async function getTodayAppointments(): Promise<Appointment[]> {
  const supabase = await createClient();
  const todayKey = romeDateKey();
  const start = romeDayStart(todayKey);
  const end = romeDayEnd(todayKey);

  const { data } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  return ((data as unknown as AppointmentRow[]) ?? []).map(mapAppointment);
}

export async function getUpcomingAppointments(limit = 5): Promise<Appointment[]> {
  const supabase = await createClient();
  const end = romeDayEnd(romeDateKey());

  const { data } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .gt("starts_at", end.toISOString())
    .neq("status", "annullato")
    .order("starts_at", { ascending: true })
    .limit(limit);

  return ((data as unknown as AppointmentRow[]) ?? []).map(mapAppointment);
}

/** Appuntamenti non annullati da domani ai prossimi `days` giorni (inclusi). */
export async function countUpcomingAppointments(days = 7): Promise<number> {
  const supabase = await createClient();
  const today = romeDateKey();

  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .gte("starts_at", romeDayStart(addDaysToKey(today, 1)).toISOString())
    .lte("starts_at", romeDayEnd(addDaysToKey(today, days)).toISOString())
    .neq("status", "annullato");

  return count ?? 0;
}

export async function getAppointmentsInRange(from: Date, to: Date): Promise<Appointment[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at", { ascending: true });

  return ((data as unknown as AppointmentRow[]) ?? []).map(mapAppointment);
}

export async function getClientAppointments(clientId: string): Promise<Appointment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("client_id", clientId)
    .order("starts_at", { ascending: false });

  return ((data as unknown as AppointmentRow[]) ?? []).map(mapAppointment);
}

/** Tipi di visita attivi, per il form "Nuovo appuntamento". */
export async function getActiveAppointmentTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointment_types")
    .select("id, name, duration_minutes, active")
    .eq("active", true)
    .order("duration_minutes", { ascending: false });
  return data ?? [];
}

/**
 * Controlla se un appuntamento può stare in [start, end): non nel passato,
 * dentro l'orario di apertura e fuori dai blocchi dell'agenda. Restituisce il
 * messaggio da mostrare, oppure null se va bene. La sovrapposizione con altri
 * appuntamenti la impedisce già il database.
 */
export async function checkAppointmentSlot(start: Date, end: Date): Promise<string | null> {
  if (start.getTime() < Date.now()) {
    return "Non puoi fissare un appuntamento in un orario già passato.";
  }

  const dateKey = romeDateKey(start);
  if (romeDateKey(new Date(end.getTime() - 1)) !== dateKey) {
    return "L'appuntamento deve iniziare e finire nello stesso giorno.";
  }

  const supabase = await createClient();
  const [{ data: settings }, { data: blocks }] = await Promise.all([
    supabase.from("studio_settings").select("opening_hours").maybeSingle(),
    supabase
      .from("time_blocks")
      .select("id")
      .lt("starts_at", end.toISOString())
      .gt("ends_at", start.toISOString())
      .limit(1),
  ]);

  if (blocks && blocks.length > 0) {
    return "Questo orario cade in un blocco della tua agenda. Rimuovi il blocco o scegli un altro orario.";
  }

  const windows = ((settings?.opening_hours as OpeningHours | undefined) ?? {})[String(isoDowOf(dateKey))] ?? [];
  const startHm = toRomeInputValue(start.toISOString()).slice(11, 16);
  const endHm = toRomeInputValue(end.toISOString()).slice(11, 16);
  const inside = windows.some((w) => w.start <= startHm && endHm <= w.end);
  if (!inside) {
    return windows.length === 0
      ? "Lo studio è chiuso in questo giorno (vedi Impostazioni)."
      : "Questo orario è fuori dall'orario di apertura dello studio (vedi Impostazioni).";
  }

  return null;
}

// Calcola gli orari liberi per il professionista in una data specifica,
// data la durata del tipo di appuntamento scelto. Usata dal form "Nuovo
// appuntamento" per mostrare pulsanti invece di una casella di testo
// libera, così non capita più di dover "indovinare" un orario che
// combaci esattamente con quello prima/dopo.
export async function getAvailableSlotsForDate(
  dateStr: string, // "YYYY-MM-DD"
  durationMinutes: number,
): Promise<string[]> {
  const supabase = await createClient();

  // Il giorno è quello di Roma (00:00-24:00 locali), non quello UTC.
  const dayStart = romeDayStart(dateStr).toISOString();
  const dayEnd = romeDayEnd(dateStr).toISOString();

  // Le tre letture sono indipendenti: partono insieme.
  const [{ data: settings }, { data: dayAppointments }, { data: dayBlocks }] = await Promise.all([
    supabase.from("studio_settings").select("opening_hours").maybeSingle(),
    // Tutto ciò che si sovrappone al giorno, anche se è iniziato prima
    // (per esempio un blocco di più giorni).
    supabase
      .from("appointments")
      .select("starts_at, ends_at")
      .lt("starts_at", dayEnd)
      .gt("ends_at", dayStart)
      .neq("status", "annullato"),
    supabase
      .from("time_blocks")
      .select("starts_at, ends_at")
      .lt("starts_at", dayEnd)
      .gt("ends_at", dayStart),
  ]);

  if (!settings) return [];
  const openingHours = (settings.opening_hours as OpeningHours) ?? {};
  const windows = openingHours[String(isoDowOf(dateStr))] ?? [];
  if (windows.length === 0) return [];

  return computeFreeSlots({
    dateKey: dateStr,
    windows,
    durationMinutes,
    busy: [...(dayAppointments ?? []), ...(dayBlocks ?? [])],
    nowMs: Date.now(),
  });
}
