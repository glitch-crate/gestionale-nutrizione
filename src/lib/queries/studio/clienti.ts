// Letture dell'anagrafica clienti per l'area studio.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types";

const CLIENT_SELECT = "id, studio_id, first_name, last_name, phone, email, notes, created_at, is_existing_client, auth_user_id";

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
  auth_user_id: string | null;
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
    hasPortalAccount: Boolean(c.auth_user_id),
  };
}

export async function getClientCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

/** Testo senza accenti e in minuscolo, per confronti "morbidi". */
function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Solo le cifre, senza il prefisso internazionale italiano. */
function phoneDigits(text: string): string {
  return text.replace(/\D/g, "").replace(/^(0039|39)(?=3\d{8,9}$)/, "");
}

/**
 * Elenco clienti, con ricerca facoltativa. La ricerca trova nome, cognome,
 * "nome cognome" in qualsiasi ordine, email e telefono (ignorando spazi,
 * trattini e +39). Lo studio ha poche centinaia di clienti al massimo, quindi
 * il filtro si fa qui invece che con un filtro testuale nel database.
 */
export async function getClients(search?: string): Promise<Client[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select(CLIENT_SELECT);

  const clients = ((data ?? []) as ClientRow[])
    .map(mapClient)
    .sort(
      (a, b) =>
        normalizeText(a.lastName).localeCompare(normalizeText(b.lastName), "it") ||
        normalizeText(a.firstName).localeCompare(normalizeText(b.firstName), "it"),
    );

  const term = normalizeText(search ?? "");
  if (!term) return clients;

  const words = term.split(/\s+/).filter(Boolean);
  const digits = phoneDigits(term);

  return clients.filter((c) => {
    const text = normalizeText(`${c.firstName} ${c.lastName} ${c.email}`);
    if (words.every((w) => text.includes(w))) return true;
    return digits.length >= 3 && /^[\d\s+().-]+$/.test(term) && phoneDigits(c.phone).includes(digits);
  });
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
