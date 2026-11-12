// Letture del portale cliente: profilo dell'utente autenticato.
//
// Il database di produzione non ha la funzione `get_my_profile`: il cliente
// legge la propria scheda direttamente da `clients`, dove la policy RLS
// `clients_select_self` gli restituisce solo la riga collegata al suo account.
// Il filtro su auth_user_id resta comunque esplicito.
import "server-only";
import { getCurrentUser } from "@/lib/auth/session";

export type MyClientProfile = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

export async function getMyClientProfile(): Promise<MyClientProfile | null> {
  const { supabase, user } = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, phone, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) console.error("getMyClientProfile", error.message);
  if (!data) return null;

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    email: data.email,
  };
}
