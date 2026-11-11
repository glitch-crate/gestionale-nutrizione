// Letture delle impostazioni dello studio: nome, orari e tipi di visita.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OpeningHours } from "@/types";

export async function getStudioSettings(): Promise<{ businessName: string; openingHours: OpeningHours }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_settings")
    .select("business_name, opening_hours")
    .maybeSingle();

  return {
    businessName: data?.business_name ?? "Studio",
    openingHours: (data?.opening_hours as OpeningHours) ?? {},
  };
}

/** Tutti i tipi di appuntamento, anche quelli disattivati, dal più lungo. */
export async function getAllAppointmentTypes(): Promise<
  { id: string; name: string; duration_minutes: number; active: boolean }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointment_types")
    .select("id, name, duration_minutes, active")
    .order("duration_minutes", { ascending: false });
  return data ?? [];
}
