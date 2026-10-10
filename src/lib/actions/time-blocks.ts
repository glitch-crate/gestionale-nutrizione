"use server";

import { revalidatePath } from "next/cache";
import { parseInstant } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

export async function createTimeBlockAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!startsAt || !endsAt) {
    return { success: false, error: "Indica inizio e fine del blocco." };
  }

  const start = parseInstant(startsAt);
  const end = parseInstant(endsAt);

  if (end <= start) {
    return { success: false, error: "L'orario di fine deve essere dopo quello di inizio." };
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, studio_id")
    .maybeSingle();

  if (!professional) {
    return { success: false, error: "Nessuno studio collegato a questo account." };
  }

  const { error } = await supabase.from("time_blocks").insert({
    studio_id: professional.studio_id,
    professional_id: professional.id,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    reason: reason || null,
  });

  if (error) {
    return { success: false, error: "Errore durante il salvataggio." };
  }

  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTimeBlockAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("time_blocks").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Errore durante la cancellazione." };
  }

  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return { success: true };
}
