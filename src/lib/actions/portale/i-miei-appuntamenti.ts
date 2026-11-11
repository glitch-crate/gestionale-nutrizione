"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyStudioRescheduleRequest } from "@/lib/email/notifications";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

// Messaggi scritti dalla funzione del database `request_reschedule`,
// tradotti in testi per il cliente.
function rescheduleErrorMessage(dbMessage: string): string {
  if (dbMessage.includes("non è più disponibile")) {
    return "Questo orario è appena stato occupato. Scegline un altro.";
  }
  if (dbMessage.includes("24 ore")) {
    return "Mancano meno di 24 ore all'appuntamento: per spostarlo contatta direttamente lo studio.";
  }
  if (dbMessage.includes("già una richiesta")) {
    return "Hai già una richiesta di spostamento in attesa.";
  }
  return "Non è stato possibile inviare la richiesta. Riprova.";
}

/** Il cliente chiede di spostare un appuntamento; lo studio dovrà approvare. */
export async function requestRescheduleAction(appointmentId: string, newStartsAt: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Orario attuale, per l'avviso allo studio (letto prima della richiesta).
  const [{ data: appointments }, { data: profiles }] = await Promise.all([
    supabase.rpc("get_my_appointments"),
    supabase.rpc("get_my_profile"),
  ]);

  const { error } = await supabase.rpc("request_reschedule", {
    p_appointment_id: appointmentId,
    p_new_starts_at: newStartsAt,
  });

  if (error) {
    return { success: false, error: rescheduleErrorMessage(error.message) };
  }

  const appointment = ((appointments ?? []) as { id: string; starts_at: string }[]).find(
    (a) => a.id === appointmentId,
  );
  const profile = (profiles ?? [])[0] as { first_name: string; last_name: string; phone: string } | undefined;

  if (appointment && profile) {
    after(() =>
      notifyStudioRescheduleRequest({
        clientName: `${profile.first_name} ${profile.last_name}`,
        clientPhone: profile.phone,
        oldStartsAt: appointment.starts_at,
        newStartsAt,
      }),
    );
  }

  revalidatePath("/portale/i-miei-appuntamenti");
  return { success: true };
}

/** Il cliente ritira una richiesta di spostamento ancora in attesa. */
export async function cancelRescheduleRequestAction(requestId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_reschedule_request", { p_request_id: requestId });

  if (error) {
    return { success: false, error: "Non è stato possibile ritirare la richiesta. Riprova." };
  }

  revalidatePath("/portale/i-miei-appuntamenti");
  return { success: true };
}
