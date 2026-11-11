// Letture dell'anagrafica clienti per l'area studio.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types";

const CLIENT_SELECT = "id, studio_id, first_name, last_name, phone, email, notes, created_at, is_existing_client";

type ClientRow = {
  id: string;
  studio_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  notes: string | null;
  created_at: string;
  is_existing_client: boolean;
};

function mapClient(c: ClientRow): Client {
  return {
    id: c.id,
    studioId: c.studio_id,
    firstName: c.first_name,
    lastName: c.last_name,
    phone: c.phone,
    email: c.email,
    notes: c.notes,
    createdAt: c.created_at,
    isExistingClient: c.is_existing_client,
  };
}

export async function getClientCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export async function getClients(search?: string): Promise<Client[]> {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .order("last_name", { ascending: true });

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data } = await query;

  return ((data ?? []) as ClientRow[]).map(mapClient);
}

/** Ultimi clienti aggiunti, dal più recente. */
export async function getRecentClients(limit = 4): Promise<Client[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as ClientRow[]).map(mapClient);
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  return data ? mapClient(data as ClientRow) : null;
}
