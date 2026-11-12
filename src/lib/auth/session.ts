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

// Portale: crea la scheda cliente al primo accesso (dopo la conferma
// dell'email) con i dati lasciati in registrazione, oppure la restituisce
// se esiste già. Restituisce null se l'utente non è un cliente.
//
// La funzione `ensure_client_profile` del database di produzione è una
// versione precedente: crea sempre una scheda nuova e non collega quella che
// lo studio ha già inserito con la stessa email (fallirebbe sul vincolo di
// email unica, e il cliente resterebbe fuori dal portale). Il collegamento lo
// facciamo quindi qui, lato server, prima di chiamarla:
// - solo se l'email dell'account è stata verificata (prova che è sua);
// - solo verso una scheda senza account collegato.
// Inoltre la vecchia funzione copia `is_existing_client` dai metadati
// dell'account, che il cliente può impostare da sé: lo azzeriamo, perché
// quel flag lo decide solo lo studio.
export async function ensureClientProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const [{ data: existing }, { data: professional }] = await Promise.all([
    supabase.from("clients").select("id").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("professionals").select("id").eq("auth_user_id", user.id).maybeSingle(),
  ]);
  // Il professionista non deve mai ricevere una scheda cliente.
  if (professional) return null;

  if (!existing && user.email_confirmed_at) {
    await linkExistingClientByEmail(user.id, user.email, user.user_metadata);
  }

  const { data, error } = await supabase.rpc("ensure_client_profile");
  if (error) {
    console.error("ensure_client_profile", error.message);
    return null;
  }

  const claimed = user.user_metadata?.is_existing_client;
  if (claimed === true || claimed === "true") {
    await clearSelfDeclaredExistingFlag(user.id, user.user_metadata);
  }

  return data ?? null;
}

async function linkExistingClientByEmail(
  userId: string,
  email: string,
  metadata: Record<string, unknown> | undefined,
) {
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const service = createServiceRoleClient();
    const { data: candidates } = await service
      .from("clients")
      .select("id, email")
      .ilike("email", email.trim())
      .is("auth_user_id", null)
      .limit(2);

    // Solo un abbinamento certo: esattamente una scheda con questa email.
    const match = (candidates ?? []).filter(
      (c) => c.email.trim().toLowerCase() === email.trim().toLowerCase(),
    );
    if (match.length !== 1) return;

    const update: Record<string, unknown> = { auth_user_id: userId };
    if (metadata?.privacy_accepted === true || metadata?.privacy_accepted === "true") {
      update.privacy_accepted_at = new Date().toISOString();
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

async function clearSelfDeclaredExistingFlag(userId: string, metadata: Record<string, unknown>) {
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const service = createServiceRoleClient();
    // Solo schede appena create dall'account stesso: un flag impostato dallo
    // studio su una scheda esistente non va toccato.
    await service
      .from("clients")
      .update({ is_existing_client: false })
      .eq("auth_user_id", userId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    // Togliamo la dichiarazione dai metadati, così non viene riletta.
    await service.auth.admin.updateUserById(userId, {
      user_metadata: { ...metadata, is_existing_client: null },
    });
  } catch (err) {
    console.error("clearSelfDeclaredExistingFlag", err);
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
