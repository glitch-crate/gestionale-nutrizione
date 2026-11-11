"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyClientBookingConfirmed, notifyStudioNewBooking } from "@/lib/email/notifications";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

// Messaggi scritti dalla funzione del database `book_appointment`, tradotti
// in testi per il cliente. Qualsiasi altro errore resta generico.
function bookingErrorMessage(dbMessage: string): string {
  if (dbMessage.includes("non è più disponibile")) {
    return "Questo orario è stato appena prenotato da qualcun altro. Scegline un altro.";
  }
  if (dbMessage.includes("già un appuntamento")) {
    return "Hai già un appuntamento in programma: potrai prenotarne un altro dall'inizio della visita.";
  }
  if (dbMessage.includes("richiesta di spostamento")) {
    return "Hai una richiesta di spostamento in attesa: potrai prenotare di nuovo quando lo studio risponde.";
  }
  return "Non è stato possibile completare la prenotazione. Riprova.";
}

/** Il cliente prenota un orario libero. Tutti i controlli stanno nel database. */
export async function bookAppointmentAction(startsAt: string, typeName: string | null): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: appointmentId, error } = await supabase.rpc("book_appointment", {
    p_starts_at: startsAt,
    p_type_name: typeName,
  });

  if (error) {
    return { success: false, error: bookingErrorMessage(error.message) };
  }

  // Dati per le email: profilo del cliente e appuntamento appena creato.
  const [{ data: profiles }, { data: appointments }] = await Promise.all([
    supabase.rpc("get_my_profile"),
    supabase.rpc("get_my_appointments"),
  ]);
  const profile = (profiles ?? [])[0] as
    | { first_name: string; last_name: string; phone: string; email: string }
    | undefined;
  const appointment = ((appointments ?? []) as { id: string; starts_at: string; appointment_type_name: string }[]).find(
    (a) => a.id === appointmentId,
  );

  // Le email partono dopo la risposta: il cliente non aspetta e un invio
  // fallito non annulla la prenotazione.
  if (profile && appointment) {
    after(async () => {
      await Promise.all([
        notifyClientBookingConfirmed({
          to: profile.email,
          firstName: profile.first_name,
          startsAt: appointment.starts_at,
          typeName: appointment.appointment_type_name,
        }),
        notifyStudioNewBooking({
          clientName: `${profile.first_name} ${profile.last_name}`,
          clientPhone: profile.phone,
          startsAt: appointment.starts_at,
          typeName: appointment.appointment_type_name,
        }),
      ]);
    });
  }

  revalidatePath("/portale/i-miei-appuntamenti");
  return { success: true };
}
