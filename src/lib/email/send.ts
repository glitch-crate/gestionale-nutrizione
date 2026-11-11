// Invio di email tramite Resend (https://resend.com).
// Servono RESEND_API_KEY e, per spedire da un dominio dello studio, RESEND_FROM.
import "server-only";
import { STUDIO } from "@/config/studio";

export type Email = { to: string; subject: string; text: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// L'oggetto è una riga sola: niente a capo o tabulazioni (arrivano anche da
// dati inseriti dai clienti, come il nome).
function singleLine(text: string): string {
  return text.replace(/[\r\n\t]+/g, " ").trim();
}

/** Invia un'email. Lancia un errore se Resend non è configurato o rifiuta l'invio. */
export async function sendEmail({ to, subject, text }: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY mancante");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || `${STUDIO.name} <onboarding@resend.dev>`,
      to,
      subject: singleLine(subject),
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend ha risposto ${response.status}: ${body}`);
  }
}

/**
 * Invio "di cortesia": se le email non sono configurate o l'invio fallisce,
 * scrive nei log e prosegue. Si usa per le notifiche, che non devono mai
 * bloccare l'operazione principale (prenotazione, spostamento…).
 */
export async function trySendEmail(email: Email, context: string): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    await sendEmail(email);
    return true;
  } catch (err) {
    console.error(`[email] ${context}:`, err instanceof Error ? err.message : err);
    return false;
  }
}
