"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

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

  // Aggiorniamo SOLO questi tre campi: non tocchiamo email, studio_id
  // o lo stato "cliente già esistente", anche se la policy di
  // sicurezza del database tecnicamente lo permetterebbe.
  const { error } = await supabase
    .from("clients")
    .update({ first_name: firstName, last_name: lastName, phone })
    .eq("auth_user_id", user.id);

  if (error) {
    return { success: false, error: "Errore durante il salvataggio." };
  }

  revalidatePath("/portale/profilo");
  return { success: true };
}
