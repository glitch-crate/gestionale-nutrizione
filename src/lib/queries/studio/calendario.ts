// Letture per il calendario dello studio: blocchi di orario.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TimeBlock } from "@/types";

export async function getTimeBlocksInRange(from: Date, to: Date): Promise<TimeBlock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_blocks")
    .select("id, starts_at, ends_at, reason")
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at", { ascending: true });

  return (data ?? []).map((b) => ({
    id: b.id,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    reason: b.reason,
  }));
}
