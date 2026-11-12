"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { parseInstant } from "@/lib/timezone";
import { getProfessionalClient } from "@/lib/auth/session";
import { notifyClientAppointmentChangedByStudio } from "@/lib/email/notifications";
import { checkAppointmentSlot, getAvailableSlotsForDate } from "@/lib/queries/studio/appuntamenti";
import type { ActionResult, AppointmentStatus } from "@/types";

type SupabaseServer = NonNullable<Awaited<ReturnType<typeof getProfessionalClient>>>;

function revalidateAgenda() {
  revalidatePath("/appuntamenti");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  revalidatePath("/clienti", "layout");
}

/** Dati per l'email al cliente; null se mancano (email non bloccanti). */
async function loadForEmail(supabase: SupabaseServer, appointmentId: string) {
  const { data } = await supabase
    .from("appointments")
    .select("starts_at, clients(first_name, email), appointment_types(name)")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!data) return null;
  const client = data.clients as unknown as { first_name: string; email: string } | null;
  const type = data.appointment_types as unknown as { name: string } | null;
  if (!client?.email) return null;
  return { to: client.email, firstName: client.first_name, startsAt: data.starts_at, typeName: type?.name };
}

export async function getAvailableSlotsAction(
  dateStr: string,
  durationMinutes: number,
): Promise<string[]> {
  if (!(await getProfessionalClient())) return [];
  return getAvailableSlotsForDate(dateStr, durationMinutes);
}

export async function createAppointmentAction(formData: FormData): Promise<ActionResult> {
  const supabase = await getProfessionalClient();
  if (!supabase) return { success: false, error: "Non autorizzato." };

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

  const start = parseInstant(startsAt);
  const end = new Date(start.getTime() + type.duration_minutes * 60 * 1000);

  const slotError = await checkAppointmentSlot(start, end);
  if (slotError) return { success: false, error: slotError };

  const { data: created, error } = await supabase
    .from("appointments")
    .insert({
      studio_id: professional.studio_id,
      client_id: clientId,
      appointment_type_id: appointmentTypeId,
      professional_id: professional.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: "confermato",
      notes: notes || null,
      created_by: "professionista",
    })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: error.code === "23P01" ? "Questo orario si sovrappone a un altro appuntamento." : "Errore durante il salvataggio.",
    };
  }

  const email = await loadForEmail(supabase, created.id);
  if (email) after(() => notifyClientAppointmentChangedByStudio({ ...email, kind: "creato" }));

  revalidateAgenda();
  return { success: true };
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<ActionResult> {
  const supabase = await getProfessionalClient();
  if (!supabase) return { success: false, error: "Non autorizzato." };

  const { data: current } = await supabase
    .from("appointments")
    .select("starts_at, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!current) return { success: false, error: "Appuntamento non trovato." };
  if (current.status === "annullato" || current.status === "completato") {
    return { success: false, error: "Questo appuntamento è già chiuso e non si può modificare." };
  }
  if (status === "completato" && new Date(current.starts_at).getTime() > Date.now()) {
    return { success: false, error: "Puoi segnare come completato un appuntamento solo dopo che è iniziato." };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);

  if (error) {
    return { success: false, error: "Errore durante l'aggiornamento." };
  }

  if (status === "annullato" && new Date(current.starts_at).getTime() > Date.now()) {
    const email = await loadForEmail(supabase, appointmentId);
    if (email) after(() => notifyClientAppointmentChangedByStudio({ ...email, kind: "annullato" }));
  }

  revalidateAgenda();
  return { success: true };
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  newStartsAt: string,
): Promise<ActionResult> {
  const supabase = await getProfessionalClient();
  if (!supabase) return { success: false, error: "Non autorizzato." };

  const { data: appointment } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) {
    return { success: false, error: "Appuntamento non trovato." };
  }
  if (appointment.status === "annullato" || appointment.status === "completato") {
    return { success: false, error: "Questo appuntamento è già chiuso e non si può spostare." };
  }

  const durationMs =
    new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime();
  const newStart = parseInstant(newStartsAt);
  if (Number.isNaN(newStart.getTime())) {
    return { success: false, error: "Indica una data e un orario validi." };
  }
  const newEnd = new Date(newStart.getTime() + durationMs);

  if (newStart.getTime() === new Date(appointment.starts_at).getTime()) {
    return { success: false, error: "Hai indicato lo stesso orario di prima." };
  }

  const slotError = await checkAppointmentSlot(newStart, newEnd);
  if (slotError) return { success: false, error: slotError };

  // reminder_sent_at azzerato: il promemoria va rimandato per il nuovo giorno.
  const { error } = await supabase
    .from("appointments")
    .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString(), reminder_sent_at: null })
    .eq("id", appointmentId);

  if (error) {
    return {
      success: false,
      error: error.code === "23P01" ? "Questo orario si sovrappone a un altro appuntamento." : "Errore durante lo spostamento.",
    };
  }

  const email = await loadForEmail(supabase, appointmentId);
  if (email) {
    after(() =>
      notifyClientAppointmentChangedByStudio({ ...email, kind: "spostato", oldStartsAt: appointment.starts_at }),
    );
  }

  revalidateAgenda();
  return { success: true };
}
