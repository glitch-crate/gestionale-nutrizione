import { createClient } from "@/lib/supabase/server";
import type { Appointment, AppointmentStatus, Client } from "@/types";

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
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

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
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .gt("starts_at", end.toISOString())
    .neq("status", "annullato")
    .order("starts_at", { ascending: true })
    .limit(limit);

  return ((data as unknown as AppointmentRow[]) ?? []).map(mapAppointment);
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

export async function getClientCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export async function getClients(search?: string): Promise<Client[]> {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("id, studio_id, first_name, last_name, phone, email, notes, created_at, is_existing_client")
    .order("last_name", { ascending: true });

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data } = await query;

  return (data ?? []).map((c) => ({
    id: c.id,
    studioId: c.studio_id,
    firstName: c.first_name,
    lastName: c.last_name,
    phone: c.phone,
    email: c.email,
    notes: c.notes,
    createdAt: c.created_at,
    isExistingClient: c.is_existing_client,
  }));
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, studio_id, first_name, last_name, phone, email, notes, created_at, is_existing_client")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    studioId: data.studio_id,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    email: data.email,
    notes: data.notes,
    createdAt: data.created_at,
    isExistingClient: data.is_existing_client,
  };
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

export async function getAppointmentTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointment_types")
    .select("id, name, duration_minutes, active")
    .eq("active", true)
    .order("duration_minutes", { ascending: false });
  return data ?? [];
}

export async function getStudioOpeningHours(): Promise<Record<string, { start: string; end: string }[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_settings")
    .select("opening_hours")
    .maybeSingle();
  return (data?.opening_hours as Record<string, { start: string; end: string }[]>) ?? {};
}

// Conteggio approssimativo degli slot liberi di oggi, usato solo per la
// card riassuntiva della dashboard (non per la prenotazione vera e
// propria, che usa sempre la durata del tipo di appuntamento corretto).
export async function getFreeSlotsCountToday(): Promise<number> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("studio_settings")
    .select("opening_hours, default_slot_minutes")
    .maybeSingle();

  if (!settings) return 0;

  const openingHours = (settings.opening_hours as Record<string, { start: string; end: string }[]>) ?? {};
  const duration = settings.default_slot_minutes ?? 30;

  const now = new Date();
  const isoDow = String(((now.getDay() + 6) % 7) + 1); // 1=lun ... 7=dom
  const windows = openingHours[isoDow] ?? [];

  if (windows.length === 0) return 0;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  const [{ data: todaysAppointments }, { data: todaysBlocks }] = await Promise.all([
    supabase
      .from("appointments")
      .select("starts_at, ends_at")
      .gte("starts_at", todayStart)
      .lte("starts_at", todayEnd)
      .neq("status", "annullato"),
    supabase
      .from("time_blocks")
      .select("starts_at, ends_at")
      .gte("starts_at", todayStart)
      .lte("starts_at", todayEnd),
  ]);

  const busy = [...(todaysAppointments ?? []), ...(todaysBlocks ?? [])].map((a) => ({
    start: new Date(a.starts_at).getTime(),
    end: new Date(a.ends_at).getTime(),
  }));

  let freeCount = 0;

  for (const window of windows) {
    const [startH, startM] = window.start.split(":").map(Number);
    const [endH, endM] = window.end.split(":").map(Number);
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM);
    const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);

    let cursor = windowStart.getTime();
    const step = duration * 60 * 1000;

    while (cursor + step <= windowEnd.getTime()) {
      const slotEnd = cursor + step;
      const isPast = cursor <= now.getTime();
      const overlaps = busy.some((b) => b.start < slotEnd && b.end > cursor);
      if (!isPast && !overlaps) freeCount += 1;
      cursor = slotEnd;
    }
  }

  return freeCount;
}

export type TimeBlock = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

export async function getTimeBlocksInRange(from: Date, to: Date): Promise<TimeBlock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_blocks")
    .select("id, starts_at, ends_at, reason")
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at", { ascending: true });

  return (data ?? []).map((b) => ({
    id: b.id,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    reason: b.reason,
  }));
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

  const { data: settings } = await supabase
    .from("studio_settings")
    .select("opening_hours")
    .maybeSingle();

  if (!settings) return [];

  const openingHours = (settings.opening_hours as Record<string, { start: string; end: string }[]>) ?? {};

  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const isoDow = String(dateObj.getUTCDay() === 0 ? 7 : dateObj.getUTCDay());
  const windows = openingHours[isoDow] ?? [];

  if (windows.length === 0) return [];

  // Il server gira in UTC: per convertire correttamente gli orari di
  // apertura (pensati nel fuso di Roma) calcoliamo lo scarto esatto per
  // quel giorno specifico, che gestisce da solo l'ora legale.
  const noonUtc = new Date(`${dateStr}T12:00:00.000Z`);
  const romeHourAtNoonUtc = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hour12: false,
    }).format(noonUtc),
    10,
  );
  const offsetHours = romeHourAtNoonUtc - 12; // +1 (CET) oppure +2 (CEST)

  const dayStart = `${dateStr}T00:00:00`;
  const dayEnd = `${dateStr}T23:59:59`;

  const [{ data: dayAppointments }, { data: dayBlocks }] = await Promise.all([
    supabase
      .from("appointments")
      .select("starts_at, ends_at")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd)
      .neq("status", "annullato"),
    supabase
      .from("time_blocks")
      .select("starts_at, ends_at")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd),
  ]);

  const busy = [...(dayAppointments ?? []), ...(dayBlocks ?? [])].map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));

  const now = Date.now();
  const slots: string[] = [];
  const step = durationMinutes * 60 * 1000;

  for (const window of windows) {
    const [startH, startM] = window.start.split(":").map(Number);
    const [endH, endM] = window.end.split(":").map(Number);
    const windowStartUtc = new Date(`${dateStr}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00.000Z`);
    windowStartUtc.setUTCHours(windowStartUtc.getUTCHours() - offsetHours);
    const windowEndUtc = new Date(`${dateStr}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00.000Z`);
    windowEndUtc.setUTCHours(windowEndUtc.getUTCHours() - offsetHours);

    let cursor = windowStartUtc.getTime();
    const windowEnd = windowEndUtc.getTime();

    while (cursor + step <= windowEnd) {
      const slotEnd = cursor + step;
      const overlaps = busy.some((b) => b.start < slotEnd && b.end > cursor);
      if (cursor > now && !overlaps) slots.push(new Date(cursor).toISOString());
      cursor = slotEnd;
    }
  }

  return slots;
}
