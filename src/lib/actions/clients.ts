"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

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
  const supabase = await createClient();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!firstName || !lastName || !phone || !email) {
    return { success: false, error: "Compila tutti i campi obbligatori." };
  }

  const { error } = await supabase
    .from("clients")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      email,
      notes: notes || null,
    })
    .eq("id", clientId);

  if (error) {
    return { success: false, error: "Errore durante il salvataggio." };
  }

  revalidatePath("/clienti");
  revalidatePath(`/clienti/${clientId}`);
  return { success: true };
}
