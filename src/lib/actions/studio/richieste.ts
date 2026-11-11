"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getProfessionalClient } from "@/lib/auth/session";
import { notifyClientRescheduleOutcome } from "@/lib/email/notifications";
import type { ActionResult } from "@/types";

// La dottoressa approva o rifiuta una richiesta di spostamento.
// Tutta la logica (controlli, spostamento dell'appuntamento) sta nella
// funzione del database `resolve_reschedule_request`: qui si chiama soltanto.
export async function resolveRescheduleAction(
  requestId: string,
  approve: boolean,
): Promise<ActionResult> {
  const supabase = await getProfessionalClient();
  if (!supabase) return { success: false, error: "Non autorizzato." };

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

  // Avvisiamo il cliente dell'esito (dopo la risposta, senza bloccare).
  const { data: request } = await supabase
    .from("reschedule_requests")
    .select("old_starts_at, new_starts_at, clients(first_name, email)")
    .eq("id", requestId)
    .maybeSingle();
  const client = request?.clients as unknown as { first_name: string; email: string } | null;

  if (request && client?.email) {
    after(() =>
      notifyClientRescheduleOutcome({
        to: client.email,
        firstName: client.first_name,
        approved: approve,
        oldStartsAt: request.old_starts_at,
        newStartsAt: request.new_starts_at,
      }),
    );
  }

  revalidatePath("/richieste");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  revalidatePath("/appuntamenti");
  return { success: true };
}
