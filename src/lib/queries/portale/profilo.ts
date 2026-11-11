// Letture del portale cliente: profilo dell'utente autenticato.
import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getMyClientProfile() {
  const supabase = await createClient();

  // Il cliente non ha accesso diretto alla tabella `clients`: la funzione
  // restituisce solo la sua scheda e solo i campi che può vedere.
  const { data: rows } = await supabase.rpc("get_my_profile");
  const data = (rows ?? [])[0] as
    | { id: string; first_name: string; last_name: string; phone: string; email: string }
    | undefined;

  if (!data) return null;

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    email: data.email,
  };
}
