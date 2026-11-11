// Promemoria email inviati ai clienti il giorno prima dell'appuntamento
// (tramite Resend). Avviato ogni mattina dalla route
// src/app/api/cron/send-reminders, chiamata da Vercel Cron.
import "server-only";
import { STUDIO } from "@/config/studio";
import { sendEmail } from "@/lib/email/send";
import { formatDayLong, formatTime } from "@/lib/format";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { addDaysToKey, romeDateKey, romeDayEnd, romeDayStart } from "@/lib/timezone";

export type ReminderEmail = {
  to: string;
  clientFirstName: string;
  startsAt: string; // ISO
  appointmentTypeName: string;
};

export async function sendReminderEmail({ to, clientFirstName, startsAt, appointmentTypeName }: ReminderEmail) {
  const time = formatTime(startsAt);
  const dateLabel = formatDayLong(startsAt);

  await sendEmail({
    to,
    subject: `Promemoria: appuntamento domani alle ${time}`,
    text: `Ciao ${clientFirstName},\n\nTi ricordiamo il tuo appuntamento di domani, ${dateLabel}, alle ${time} (${appointmentTypeName}).\n\nA presto,\n${STUDIO.name}`,
  });
}

/**
 * Invia il promemoria a chi ha un appuntamento confermato domani e non l'ha
 * ancora ricevuto. Usa la chiave service role: il job gira senza utente
 * collegato e deve leggere gli appuntamenti di tutti i clienti.
 * Lancia un errore solo se non riesce a leggere gli appuntamenti; i
 * singoli invii falliti vengono contati e scritti nei log.
 */
export async function sendTomorrowReminders(): Promise<{ checked: number; sent: number; failed: number }> {
  const supabase = createServiceRoleClient();
  const tomorrow = addDaysToKey(romeDateKey(), 1);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id, starts_at, clients(first_name, email), appointment_types(name)")
    .gte("starts_at", romeDayStart(tomorrow).toISOString())
    .lte("starts_at", romeDayEnd(tomorrow).toISOString())
    .eq("status", "confermato")
    .is("reminder_sent_at", null);

  if (error) {
    throw new Error(`lettura appuntamenti fallita: ${error.message}`);
  }

  let sent = 0;
  let failed = 0;

  for (const appointment of appointments ?? []) {
    const client = appointment.clients as unknown as { first_name: string; email: string } | null;
    const type = appointment.appointment_types as unknown as { name: string } | null;

    if (!client?.email) continue;

    try {
      await sendReminderEmail({
        to: client.email,
        clientFirstName: client.first_name,
        startsAt: appointment.starts_at,
        appointmentTypeName: type?.name ?? "appuntamento",
      });

      await supabase
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appointment.id);

      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`[promemoria] non inviato per ${appointment.id}:`, err instanceof Error ? err.message : err);
    }
  }

  return { checked: appointments?.length ?? 0, sent, failed };
}
