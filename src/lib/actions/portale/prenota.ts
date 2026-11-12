"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyClientBookingConfirmed, notifyStudioNewBooking } from "@/lib/email/notifications";
import { getMyAppointments } from "@/lib/queries/portale/appuntamenti";
import { getMyClientProfile } from "@/lib/queries/portale/profilo";
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

  // Nel database di produzione `book_appointment` restituisce la riga
  // dell'appuntamento creato (non solo l'id).
  const { data: created, error } = await supabase.rpc("book_appointment", {
    p_starts_at: startsAt,
    p_type_name: typeName,
  });

  if (error) {
    return { success: false, error: bookingErrorMessage(error.message) };
  }

  // Dati per le email: profilo del cliente e appuntamento appena creato.
  const row = (Array.isArray(created) ? created[0] : created) as
    | { id: string; starts_at: string }
    | null
    | undefined;
  const [profile, appointments] = await Promise.all([getMyClientProfile(), getMyAppointments()]);
  const appointment = row ? appointments.find((a) => a.id === row.id) : undefined;

  // Le email partono dopo la risposta: il cliente non aspetta e un invio
  // fallito non annulla la prenotazione.
  if (profile && appointment) {
    const typeLabel = appointment.appointment_type_name ?? typeName ?? "Appuntamento";
    after(async () => {
      await Promise.all([
        notifyClientBookingConfirmed({
          to: profile.email,
          firstName: profile.firstName,
          startsAt: appointment.starts_at,
          typeName: typeLabel,
        }),
        notifyStudioNewBooking({
          clientName: `${profile.firstName} ${profile.lastName}`,
          clientPhone: profile.phone,
          startsAt: appointment.starts_at,
          typeName: typeLabel,
        }),
      ]);
    });
  }

  revalidatePath("/portale/i-miei-appuntamenti");
  return { success: true };
}
