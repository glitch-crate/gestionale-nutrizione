"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RescheduleResult = { success: true } | { success: false; error: string };

// La dottoressa approva o rifiuta una richiesta di spostamento.
// Tutta la logica (controlli, spostamento dell'appuntamento) sta nella
// funzione del database `resolve_reschedule_request`: qui si chiama soltanto.
export async function resolveRescheduleAction(
  requestId: string,
  approve: boolean,
): Promise<RescheduleResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("resolve_reschedule_request", {
    p_request_id: requestId,
    p_approve: approve,
  });

  if (error) {
    // I messaggi scritti da noi nel database (codice P0001) sono già in italiano.
    return {
      success: false,
      error: error.code === "P0001" ? error.message : "Non è stato possibile completare l'operazione. Riprova.",
    };
  }

  if (data?.status === "scaduta") {
    revalidatePath("/richieste");
    return {
      success: false,
      error: "La richiesta è scaduta: l'orario non è più riservato. L'appuntamento resta com'era.",
    };
  }

  revalidatePath("/richieste");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  revalidatePath("/appuntamenti");
  return { success: true };
}
