"use server";

import { revalidatePath } from "next/cache";
import { getProfessionalClient } from "@/lib/auth/session";
import type { ActionResult } from "@/types";

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  const supabase = await getProfessionalClient();
  if (!supabase) return { success: false, error: "Non autorizzato." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!firstName || !lastName || !phone || !email) {
    return { success: false, error: "Compila tutti i campi obbligatori." };
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("studio_id")
    .maybeSingle();

  if (!professional) {
    return { success: false, error: "Nessuno studio collegato a questo account." };
  }

  const { error } = await supabase.from("clients").insert({
    studio_id: professional.studio_id,
    first_name: firstName,
    last_name: lastName,
    phone,
    email,
    notes: notes || null,
  });

  if (error) {
    return {
      success: false,
      error: error.code === "23505" ? "Esiste già un cliente con questa email." : "Errore durante il salvataggio.",
    };
  }

  revalidatePath("/clienti");
  return { success: true };
}

export async function updateClientAction(clientId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await getProfessionalClient();
  if (!supabase) return { success: false, error: "Non autorizzato." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!firstName || !lastName || !phone || !email) {
    return { success: false, error: "Compila tutti i campi obbligatori." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "L'email non sembra valida." };
  }

  const { data: updated, error } = await supabase
    .from("clients")
    .update({ first_name: firstName, last_name: lastName, phone, email, notes: notes || null })
    .eq("id", clientId)
    .select("id");

  if (error || !updated?.length) {
    return {
      success: false,
      error: error?.code === "23505" ? "Esiste già un cliente con questa email." : "Errore durante il salvataggio.",
    };
  }

  revalidatePath(`/clienti/${clientId}`);
  revalidatePath("/clienti");
  return { success: true };
}

export async function deleteClientAction(clientId: string): Promise<ActionResult> {
  const supabase = await getProfessionalClient();
  if (!supabase) return { success: false, error: "Non autorizzato." };

  // Prima verifichiamo, con il client normale (soggetto a RLS), che
  // questo cliente appartenga davvero al nostro studio — così nessuno
  // può cancellare un cliente che non è il suo.
  const { data: client } = await supabase
    .from("clients")
    .select("id, auth_user_id")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) {
    return { success: false, error: "Cliente non trovato." };
  }

  // Cancelliamo prima gli appuntamenti (altrimenti il vincolo del
  // database impedirebbe di cancellare il cliente), poi il cliente.
  const { error: appointmentsError } = await supabase
    .from("appointments")
    .delete()
    .eq("client_id", clientId);

  if (appointmentsError) {
    return { success: false, error: "Errore durante la cancellazione degli appuntamenti." };
  }

  const { data: deletedClients, error: clientError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .select("id");

  if (clientError || !deletedClients?.length) {
    return { success: false, error: "Errore durante la cancellazione del cliente." };
  }

  // Se il cliente aveva un account di accesso al portale, lo rimuoviamo
  // del tutto (serve la chiave amministrativa: un client normale non
  // può cancellare account altrui).
  if (client.auth_user_id) {
    try {
      const { createServiceRoleClient } = await import("@/lib/supabase/service");
      const serviceClient = createServiceRoleClient();
      await serviceClient.auth.admin.deleteUser(client.auth_user_id);
    } catch {
      // Il cliente è comunque stato eliminato dal gestionale: se la
      // pulizia dell'account fallisce, non blocchiamo l'operazione
      // principale, ma non è un errore da mostrare come bloccante.
    }
  }

  revalidatePath("/clienti");
  return { success: true };
}

export async function setExistingClientFlagAction(
  clientId: string,
  value: boolean,
): Promise<ActionResult> {
  const supabase = await getProfessionalClient();
  if (!supabase) return { success: false, error: "Non autorizzato." };

  const { error } = await supabase
    .from("clients")
    .update({ is_existing_client: value })
    .eq("id", clientId);

  if (error) {
    return { success: false, error: "Errore durante il salvataggio." };
  }

  revalidatePath(`/clienti/${clientId}`);
  revalidatePath("/clienti");
  return { success: true };
}

