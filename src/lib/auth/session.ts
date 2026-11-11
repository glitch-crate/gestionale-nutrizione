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
export async function ensureClientProfile() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("ensure_client_profile");
  return data ?? null;
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
