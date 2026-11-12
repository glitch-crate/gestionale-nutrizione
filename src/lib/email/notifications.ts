// Email automatiche legate a prenotazioni e spostamenti:
// - al cliente: conferma della prenotazione, esito della richiesta di spostamento;
// - allo studio: nuova prenotazione dal portale, nuova richiesta di spostamento.
// Sono tutte "di cortesia": se l'invio fallisce l'operazione resta valida.
import "server-only";
import { STUDIO } from "@/config/studio";
import { trySendEmail } from "@/lib/email/send";
import { capitalize, formatDayLong, formatTime } from "@/lib/format";

/** "Lunedì 3 novembre alle 09:30" */
function when(iso: string): string {
  return `${capitalize(formatDayLong(iso))} alle ${formatTime(iso)}`;
}

const SIGNATURE = `A presto,\n${STUDIO.name}\nTel. ${STUDIO.contact.phone} · ${STUDIO.contact.email}`;

export function notifyClientBookingConfirmed(p: {
  to: string;
  firstName: string;
  startsAt: string;
  typeName: string;
}) {
  return trySendEmail(
    {
      to: p.to,
      subject: `Appuntamento confermato: ${when(p.startsAt)}`,
      text:
        `Ciao ${p.firstName},\n\n` +
        `il tuo appuntamento è confermato:\n${when(p.startsAt)} — ${p.typeName}\n\n` +
        `Puoi chiedere di spostarlo fino a 24 ore prima dalla sezione "I miei appuntamenti" del portale. ` +
        `Per annullarlo contatta lo studio.\n\n${SIGNATURE}`,
    },
    "conferma prenotazione al cliente",
  );
}

export function notifyStudioNewBooking(p: {
  clientName: string;
  clientPhone: string;
  startsAt: string;
  typeName: string;
}) {
  return trySendEmail(
    {
      to: STUDIO.notificationsEmail,
      subject: `Nuova prenotazione: ${p.clientName}, ${when(p.startsAt)}`,
      text:
        `${p.clientName} (tel. ${p.clientPhone}) ha prenotato dal portale:\n` +
        `${when(p.startsAt)} — ${p.typeName}\n\n` +
        `L'appuntamento è già in calendario.`,
    },
    "avviso nuova prenotazione allo studio",
  );
}

export function notifyStudioRescheduleRequest(p: {
  clientName: string;
  clientPhone: string;
  oldStartsAt: string;
  newStartsAt: string;
}) {
  return trySendEmail(
    {
      to: STUDIO.notificationsEmail,
      subject: `Richiesta di spostamento: ${p.clientName}`,
      text:
        `${p.clientName} (tel. ${p.clientPhone}) chiede di spostare un appuntamento:\n` +
        `da: ${when(p.oldStartsAt)}\n` +
        `a:  ${when(p.newStartsAt)}\n\n` +
        `Il nuovo orario resta riservato per al massimo 48 ore. ` +
        `Approva o rifiuta dalla pagina "Richieste" del gestionale.`,
    },
    "avviso richiesta di spostamento allo studio",
  );
}

/** Appuntamento creato, spostato o annullato dallo studio: avviso al cliente. */
export function notifyClientAppointmentChangedByStudio(p: {
  to: string;
  firstName: string;
  kind: "creato" | "spostato" | "annullato";
  startsAt: string;
  oldStartsAt?: string;
  typeName?: string;
}) {
  const type = p.typeName ? ` — ${p.typeName}` : "";
  const subject =
    p.kind === "creato"
      ? `Nuovo appuntamento: ${when(p.startsAt)}`
      : p.kind === "spostato"
        ? `Appuntamento spostato: ${when(p.startsAt)}`
        : `Appuntamento annullato: ${when(p.startsAt)}`;
  const body =
    p.kind === "creato"
      ? `lo studio ha fissato per te un appuntamento:\n${when(p.startsAt)}${type}\n\n` +
        `Lo trovi anche nella sezione "I miei appuntamenti" del portale.`
      : p.kind === "spostato"
        ? `lo studio ha spostato il tuo appuntamento` +
          (p.oldStartsAt ? ` di ${when(p.oldStartsAt)}` : "") +
          `.\nIl nuovo orario è:\n${when(p.startsAt)}${type}`
        : `lo studio ha annullato il tuo appuntamento di ${when(p.startsAt)}${type}.\n\n` +
          `Per fissarne un altro puoi prenotare dal portale o contattare lo studio.`;

  return trySendEmail(
    { to: p.to, subject, text: `Ciao ${p.firstName},\n\n${body}\n\n${SIGNATURE}` },
    `appuntamento ${p.kind} dallo studio, avviso al cliente`,
  );
}

export function notifyClientRescheduleOutcome(p: {
  to: string;
  firstName: string;
  approved: boolean;
  oldStartsAt: string;
  newStartsAt: string;
}) {
  const text = p.approved
    ? `Ciao ${p.firstName},\n\nlo studio ha approvato lo spostamento. Il tuo appuntamento ora è:\n` +
      `${when(p.newStartsAt)}\n\n${SIGNATURE}`
    : `Ciao ${p.firstName},\n\nlo studio non ha potuto accettare lo spostamento a ${when(p.newStartsAt)}. ` +
      `Il tuo appuntamento resta confermato:\n${when(p.oldStartsAt)}\n\n` +
      `Per trovare un'altra soluzione contatta lo studio.\n\n${SIGNATURE}`;

  return trySendEmail(
    {
      to: p.to,
      subject: p.approved ? "Spostamento approvato" : "Spostamento non accettato",
      text,
    },
    "esito spostamento al cliente",
  );
}
