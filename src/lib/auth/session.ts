import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Chi è l'utente collegato: un professionista dello studio, un cliente del
// portale oppure nessuno. Usato dai layout per decidere cosa mostrare.
//
// Due livelli di verifica:
// - Letture (layout e pagine): getClaims() controlla in locale firma e
//   scadenza del token con la chiave pubblica del progetto (tenuta in memoria),
//   senza chiamare Supabase a ogni pagina. Il risultato è condiviso tra layout
//   e pagina della stessa richiesta (cache di React).
// - Scritture (server action): getProfessionalClient() chiede conferma al
//   server di Supabase con getUser(), così una sessione chiusa altrove non può
//   modificare dati nemmeno prima che il suo token scada.

export type CurrentProfessional = { id: string; full_name: string };
export type SessionUser = { id: string; email: string | null };

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { supabase, user: null, professional: null };

  const user: SessionUser = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return { supabase, user, professional: (professional as CurrentProfessional | null) ?? null };
});

// Portale: restituisce la scheda cliente dell'utente collegato oppure, al
// primo accesso, la crea con i dati lasciati in registrazione (funzione del
// database `ensure_client_profile`, che copia anche la risposta a "Sei già
// cliente dello studio?": chi risponde "no" e non ha appuntamenti può
// prenotare solo il "Primo incontro"). Restituisce null se l'utente non è un
// cliente.
//
// Chi era già stato inserito dallo studio con la stessa email viene collegato
// in automatico alla sua scheda, ma SOLO se ha confermato l'email cliccando
// il link ricevuto (vedi emailProvedByLink). Con la conferma disattivata in
// Supabase l'email risulta "confermata" già alla registrazione, senza nessuna
// prova: in quel caso non si collega niente, altrimenti chiunque potrebbe
// registrarsi con l'email di un altro e prendersi la sua scheda.
export async function ensureClientProfile() {
  const supabase = await createClient();

  // Percorso veloce (quasi tutte le visite): il token si verifica in locale
  // (getClaims, nessuna chiamata ad Auth) e, se la scheda esiste già, basta
  // una lettura.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const [{ data: own }, { data: professional }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, first_name, last_name, phone, email")
      .eq("auth_user_id", userId)
      .maybeSingle(),
    supabase.from("professionals").select("id").eq("auth_user_id", userId).maybeSingle(),
  ]);
  if (own) return own;
  // Il professionista non deve mai ricevere una scheda cliente.
  if (professional) return null;

  // Primo accesso: dati verificati dal server di Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email && (await emailProvedByLink(user))) {
    await linkExistingClientByEmail(user.id, user.email, user.user_metadata);
  }

  const { data, error } = await supabase.rpc("ensure_client_profile");
  if (error) {
    // Caso tipico: lo studio ha già una scheda con questa email, ma l'email
    // non è stata confermata con il link. Il login mostra un avviso.
    console.error("ensure_client_profile", error.message);
    return null;
  }
  return data ?? null;
}

/**
 * L'email è stata confermata davvero, con il link ricevuto alla registrazione?
 *
 * Supabase, dopo la conferma, svuota la data di invio dell'email
 * (`confirmation_sent_at`), quindi non si può usare quella. Si controlla:
 * - che il progetto richieda ora la conferma dell'email (`mailer_autoconfirm`
 *   spento): con la conferma automatica nessuna email prova niente;
 * - che la conferma sia arrivata almeno qualche secondo dopo la registrazione:
 *   con la conferma automatica i due istanti coincidono (pochi millisecondi),
 *   quindi gli account creati quando la conferma era spenta non si collegano;
 * - che l'email non sia mai stata cambiata o in corso di cambio, e che
 *   coincida con quella dell'identità email con cui l'account è nato.
 */
async function emailProvedByLink(user: {
  email?: string;
  created_at?: string;
  email_confirmed_at?: string;
  email_change_sent_at?: string;
  new_email?: string;
  identities?: { provider: string; identity_data?: Record<string, unknown> }[];
}): Promise<boolean> {
  if (!user.email || !user.created_at || !user.email_confirmed_at) return false;
  if (user.email_change_sent_at || user.new_email) return false;

  const confirmedAfterMs =
    new Date(user.email_confirmed_at).getTime() - new Date(user.created_at).getTime();
  if (confirmedAfterMs < 3000) return false;

  const email = user.email.trim().toLowerCase();
  const emailIdentity = (user.identities ?? []).find((i) => i.provider === "email");
  const identityEmail = String(emailIdentity?.identity_data?.email ?? "").trim().toLowerCase();
  if (identityEmail !== email) return false;

  return confirmationRequired();
}

// Impostazione pubblica di Supabase Auth, letta al massimo ogni 5 minuti.
let confirmationCache: { value: boolean; at: number } | null = null;
async function confirmationRequired(): Promise<boolean> {
  if (confirmationCache && Date.now() - confirmationCache.at < 5 * 60 * 1000) {
    return confirmationCache.value;
  }
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      cache: "no-store",
    });
    const settings = (await res.json()) as { mailer_autoconfirm?: boolean };
    const value = res.ok && settings.mailer_autoconfirm === false;
    confirmationCache = { value, at: Date.now() };
    return value;
  } catch {
    return false;
  }
}

/** Collega l'account all'unica scheda dello studio con la stessa email ancora senza account. */
async function linkExistingClientByEmail(
  userId: string,
  email: string,
  metadata: Record<string, unknown> | undefined,
) {
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const service = createServiceRoleClient();
    const wanted = email.trim().toLowerCase();
    const { data: candidates } = await service
      .from("clients")
      .select("id, email")
      .ilike("email", wanted.replace(/[\\%_]/g, (c) => `\\${c}`))
      .is("auth_user_id", null)
      .limit(2);

    // Solo un abbinamento certo: esattamente una scheda con questa email.
    const match = (candidates ?? []).filter((c) => c.email.trim().toLowerCase() === wanted);
    if (match.length !== 1) return;

    const update: Record<string, unknown> = { auth_user_id: userId };
    if (metadata?.privacy_accepted === true || metadata?.privacy_accepted === "true") {
      update.privacy_accepted_at = new Date().toISOString();
    }
    // "Sì, sono già cliente": lo conferma il proprietario dell'email. Un "no"
    // non toglie il segno messo dallo studio.
    if (metadata?.is_existing_client === true || metadata?.is_existing_client === "true") {
      update.is_existing_client = true;
    }
    const { error } = await service
      .from("clients")
      .update(update)
      .eq("id", match[0].id)
      .is("auth_user_id", null);
    if (error) console.error("linkExistingClientByEmail", error.message);
  } catch (err) {
    console.error("linkExistingClientByEmail", err);
  }
}

// Restituisce il client Supabase solo se l'utente loggato è un
// professionista. Va chiamato all'inizio di ogni server action dell'area
// studio: le action sono endpoint pubblici richiamabili da qualsiasi
// utente autenticato, compresi i clienti del portale, quindi non basta
// affidarsi alle sole RLS. Verifica la sessione con il server di Supabase.
export async function getProfessionalClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return professional ? supabase : null;
}
