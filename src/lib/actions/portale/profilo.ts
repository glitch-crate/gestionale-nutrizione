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

  // La funzione del database aggiorna SOLO questi tre campi: il cliente
  // non ha accesso diretto alla tabella `clients`.
  const { error } = await supabase.rpc("update_my_profile", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: phone,
  });

  if (error) {
    return {
      success: false,
      error: error.message.includes("non validi")
        ? "Controlla i dati: il telefono può contenere solo numeri, spazi e + ( ) - ."
        : "Errore durante il salvataggio.",
    };
  }

  revalidatePath("/portale/profilo");
  return { success: true };
}
