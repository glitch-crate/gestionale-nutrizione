"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

const DAYS = ["1", "2", "3", "4", "5", "6", "7"];

const DAY_LABELS: Record<string, string> = {
  "1": "lunedì",
  "2": "martedì",
  "3": "mercoledì",
  "4": "giovedì",
  "5": "venerdì",
  "6": "sabato",
  "7": "domenica",
};

export async function updateOpeningHoursAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const businessName = String(formData.get("businessName") ?? "").trim();
  if (!businessName) {
    return { success: false, error: "Il nome dello studio è obbligatorio." };
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("studio_id")
    .maybeSingle();

  if (!professional) {
    return { success: false, error: "Nessuno studio collegato a questo account." };
  }

  const openingHours: Record<string, { start: string; end: string }[]> = {};

  for (const day of DAYS) {
    const closed = formData.get(`closed_${day}`) === "on";
    if (closed) {
      openingHours[day] = [];
      continue;
    }

    const windows: { start: string; end: string }[] = [];
    for (const slot of ["1", "2"]) {
      const start = String(formData.get(`start_${day}_${slot}`) ?? "").trim();
      const end = String(formData.get(`end_${day}_${slot}`) ?? "").trim();
      if (start && end) {
        if (start >= end) {
          return {
            success: false,
            error: `Orario non valido per ${DAY_LABELS[day]}: l'orario di inizio (${start}) deve essere prima di quello di fine (${end}).`,
          };
        }
        windows.push({ start, end });
      }
    }
    openingHours[day] = windows;
  }

  const { error } = await supabase
    .from("studio_settings")
    .update({ business_name: businessName, opening_hours: openingHours })
    .eq("studio_id", professional.studio_id);

  if (error) {
    return {
      success: false,
      error: `Errore durante il salvataggio degli orari: ${error.message}`,
    };
  }

  revalidatePath("/impostazioni");
  return { success: true };
}

export async function updateAppointmentTypeDurationAction(
  typeId: string,
  durationMinutes: number,
): Promise<ActionResult> {
  const supabase = await createClient();

  if (!durationMinutes || durationMinutes < 5 || durationMinutes > 240) {
    return { success: false, error: "Durata non valida (tra 5 e 240 minuti)." };
  }

  const { error } = await supabase
    .from("appointment_types")
    .update({ duration_minutes: durationMinutes })
    .eq("id", typeId);

  if (error) {
    return { success: false, error: "Errore durante il salvataggio." };
  }

  revalidatePath("/impostazioni");
  return { success: true };
}
