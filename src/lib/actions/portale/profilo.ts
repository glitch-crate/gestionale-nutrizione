"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

export async function updateMyProfileAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Devi essere autenticato." };
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!firstName || !lastName || !phone) {
    return { success: false, error: "Compila tutti i campi." };
  }
  if (firstName.length > 100 || lastName.length > 100 || !/^[0-9 +().-]{5,30}$/.test(phone)) {
    return {
      success: false,
      error: "Controlla i dati: il telefono può contenere solo numeri, spazi e + ( ) - .",
    };
  }

  // Il database di produzione non ha `update_my_profile`: si aggiorna la
  // propria riga di `clients` tramite la policy RLS `clients_update_self`.
  // Aggiorniamo SOLO questi tre campi.
  const { data: updated, error } = await supabase
    .from("clients")
    .update({ first_name: firstName, last_name: lastName, phone })
    .eq("auth_user_id", user.id)
    .select("id");

  if (error || !updated?.length) {
    if (error) console.error("updateMyProfileAction", error.message);
    return { success: false, error: "Errore durante il salvataggio." };
  }

  revalidatePath("/portale/profilo");
  return { success: true };
}
