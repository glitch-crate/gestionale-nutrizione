// Letture per il calendario dello studio: blocchi di orario.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TimeBlock } from "@/types";

/** Blocchi che si sovrappongono all'intervallo, anche se iniziati prima. */
export async function getTimeBlocksInRange(from: Date, to: Date): Promise<TimeBlock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_blocks")
    .select("id, starts_at, ends_at, reason")
    .lt("starts_at", to.toISOString())
    .gt("ends_at", from.toISOString())
    .order("starts_at", { ascending: true });

  return (data ?? []).map((b) => ({
    id: b.id,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    reason: b.reason,
  }));
}
