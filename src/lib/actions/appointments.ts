"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAvailableSlotsForDate } from "@/lib/queries";
import type { AppointmentStatus } from "@/types";

export async function getAvailableSlotsAction(
  dateStr: string,
  durationMinutes: number,
): Promise<string[]> {
  return getAvailableSlotsForDate(dateStr, durationMinutes);
}

export type ActionResult = { success: true } | { success: false; error: string };

export async function createAppointmentAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const clientId = String(formData.get("clientId") ?? "");
  const appointmentTypeId = String(formData.get("appointmentTypeId") ?? "");
  const startsAt = String(formData.get("startsAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!clientId || !appointmentTypeId || !startsAt) {
    return { success: false, error: "Compila tutti i campi obbligatori." };
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, studio_id")
    .maybeSingle();

  if (!professional) {
    return { success: false, error: "Nessuno studio collegato a questo account." };
  }

  const { data: type } = await supabase
    .from("appointment_types")
    .select("duration_minutes")
    .eq("id", appointmentTypeId)
    .maybeSingle();

  if (!type) {
    return { success: false, error: "Tipo di appuntamento non valido." };
  }

  const start = new Date(startsAt);
  const end = new Date(start.getTime() + type.duration_minutes * 60 * 1000);

  const { error } = await supabase.from("appointments").insert({
    studio_id: professional.studio_id,
    client_id: clientId,
    appointment_type_id: appointmentTypeId,
    professional_id: professional.id,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    status: "confermato",
    notes: notes || null,
    created_by: "professionista",
  });

  if (error) {
    return {
      success: false,
      error: error.code === "23P01" ? "Questo orario si sovrappone a un altro appuntamento." : "Errore durante il salvataggio.",
    };
  }

  revalidatePath("/appuntamenti");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);

  if (error) {
    return { success: false, error: "Errore durante l'aggiornamento." };
  }

  revalidatePath("/appuntamenti");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  newStartsAt: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("starts_at, ends_at")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) {
    return { success: false, error: "Appuntamento non trovato." };
  }

  const durationMs =
    new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime();
  const newStart = new Date(newStartsAt);
  const newEnd = new Date(newStart.getTime() + durationMs);

  const { error } = await supabase
    .from("appointments")
    .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() })
    .eq("id", appointmentId);

  if (error) {
    return {
      success: false,
      error: error.code === "23P01" ? "Questo orario si sovrappone a un altro appuntamento." : "Errore durante lo spostamento.",
    };
  }

  revalidatePath("/appuntamenti");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return { success: true };
}
