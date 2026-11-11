// Letture per i riepiloghi della dashboard.
import "server-only";
import { romeDateKey, romeDayStart, romeDayEnd, isoDow as isoDowOf, computeFreeSlots } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";
import type { OpeningHours } from "@/types";

// Conteggio approssimativo degli slot liberi di oggi, usato solo per la
// card riassuntiva della dashboard (non per la prenotazione vera e
// propria, che usa sempre la durata del tipo di appuntamento corretto).
export async function getFreeSlotsCountToday(): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = romeDayStart(romeDateKey(now)).toISOString();
  const todayEnd = romeDayEnd(romeDateKey(now)).toISOString();

  // Le tre letture sono indipendenti: partono insieme.
  const [{ data: settings }, { data: todaysAppointments }, { data: todaysBlocks }] = await Promise.all([
    supabase.from("studio_settings").select("opening_hours, default_slot_minutes").maybeSingle(),
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

  if (!settings) return 0;
  const openingHours = (settings.opening_hours as OpeningHours) ?? {};
  const duration = settings.default_slot_minutes ?? 30;
  const isoDow = String(isoDowOf(romeDateKey(now))); // 1=lun ... 7=dom
  const windows = openingHours[isoDow] ?? [];
  if (windows.length === 0) return 0;

  // Stesso calcolo usato per gli orari liberi del gestionale, con slot
  // consecutivi della durata standard.
  return computeFreeSlots({
    dateKey: romeDateKey(now),
    windows,
    durationMinutes: duration,
    stepMinutes: duration,
    busy: [...(todaysAppointments ?? []), ...(todaysBlocks ?? [])],
    nowMs: now.getTime(),
  }).length;
}
